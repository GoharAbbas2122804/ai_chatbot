import { env } from "../env";
import type { RetrievalResult } from "../retrieval/types";

export interface RetrievalGateCheck {
  shouldProceedToLlm: boolean;
  fallbackMessage?: string;
  reason?: string;
}

/**
 * Generates the standardized catalog fallback message with contact details.
 */
export function generateCatalogFallbackMessage(): string {
  const contactParts: string[] = [];
  if (env.CONTACT_EMAIL) {
    contactParts.push(`emailing our team at ${env.CONTACT_EMAIL}`);
  }
  if (env.CONTACT_URL) {
    contactParts.push(`visiting ${env.CONTACT_URL}`);
  }

  const contactText = contactParts.length > 0 ? ` by ${contactParts.join(" or ")}` : "";

  return `I don't have that information in the active product catalog. For custom inquiries, availability, or items not listed, please contact ${env.COMPANY_NAME}${contactText}.`;
}

/**
 * L4 Retrieval Gate
 * Evaluates retrieval confidence and resolved SKUs before LLM inference.
 * Blocks hallucination by dropping queries with low/none confidence when no SKU is matched.
 */
export function checkRetrievalGate(retrieval: RetrievalResult): RetrievalGateCheck {
  // If exact SKU or comparison candidate was resolved, always proceed
  if (retrieval.confidence === "exact" || retrieval.resolvedSkus.length > 0) {
    return { shouldProceedToLlm: true };
  }

  // If MiniSearch confidence is high, proceed
  if (retrieval.confidence === "high" && retrieval.products.length > 0) {
    return { shouldProceedToLlm: true };
  }

  // Fallback: confidence is low or none and no catalog SKU was resolved
  return {
    shouldProceedToLlm: false,
    reason: `Insufficient retrieval confidence (${retrieval.confidence}, topScore: ${retrieval.topScore.toFixed(
      1
    )}) with 0 resolved SKUs`,
    fallbackMessage: generateCatalogFallbackMessage(),
  };
}
