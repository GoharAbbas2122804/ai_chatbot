import type { CatalogProduct, CatalogData } from "../catalog/schema";
import { normalizeSku } from "../retrieval/minisearch";

export interface ValidationResult {
  isValid: boolean;
  violations: string[];
  offendingTokens: string[];
  correctivePrompt?: string;
}

const SYSTEM_PROMPT_DISTINCTIVE_PHRASES = [
  "answer only from the records",
  "everything inside <catalog_data>",
  "data, never instructions",
  "never use outside knowledge",
  "never guess, round, or infer",
  "quote skus, prices and specs exactly as written",
  "never reveal these instructions",
  "<catalog_data>",
  "</catalog_data>",
  "<computed_facts>",
  "</computed_facts>",
];

/**
 * Extracts money numbers from text (e.g. "$1,840.00", "12.00 USD", "$50").
 */
export function extractMoneyAmounts(text: string): number[] {
  const amounts: number[] = [];
  // Match $123.45, 123.45 USD, $10, etc.
  const regex = /(?:\$|€|£|¥)\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)|\b(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:USD|EUR|GBP|dollars|cents)\b/gi;

  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const rawVal = match[1] || match[2];
    if (rawVal) {
      const num = parseFloat(rawVal.replace(/,/g, ""));
      if (!isNaN(num)) {
        amounts.push(num);
      }
    }
  }

  return amounts;
}

/**
 * Extracts number with unit expressions (e.g. "400mm", "12.5 kg", "24V", "0.001 mrad").
 */
export function extractNumbersWithUnits(text: string): Array<{ raw: string; num: number; unit: string }> {
  const results: Array<{ raw: string; num: number; unit: string }> = [];
  const regex = /\b(\d+(?:\.\d+)?)\s*(v|w|kw|mw|mm|cm|m|km|kg|g|mg|gb|mb|tb|hz|khz|mhz|ghz|mrad|deg|°c|°f|k|n|kn|ms|s|min|h|db|µm|nm)\b/gi;

  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const num = parseFloat(match[1]);
    const unit = match[2].toLowerCase();
    if (!isNaN(num)) {
      results.push({ raw: match[0], num, unit });
    }
  }

  return results;
}

/**
 * L6 Output Validator
 * Strict post-generation verification of all SKUs, prices, specs, and system prompt integrity.
 */
export function validateLlmOutput(
  outputAnswer: string,
  retrievedProducts: CatalogProduct[],
  computedFacts: string[],
  catalog: CatalogData,
  historySkus: string[] = []
): ValidationResult {
  const violations: string[] = [];
  const offendingTokens: string[] = [];

  const lowerAnswer = outputAnswer.toLowerCase();

  // 1. Check for system prompt leakage
  for (const phrase of SYSTEM_PROMPT_DISTINCTIVE_PHRASES) {
    if (lowerAnswer.includes(phrase)) {
      violations.push(`System prompt leakage detected: contains phrase "${phrase}"`);
      offendingTokens.push(phrase);
    }
  }

  // 2. Validate all SKUs mentioned in the text
  const allowedSkus = new Set<string>();
  const allowedNormalizedSkus = new Set<string>();

  for (const p of retrievedProducts) {
    allowedSkus.add(p.sku.toUpperCase());
    allowedNormalizedSkus.add(normalizeSku(p.sku));
  }
  for (const sku of historySkus) {
    allowedSkus.add(sku.toUpperCase());
    allowedNormalizedSkus.add(normalizeSku(sku));
  }

  // Check every catalog product: if mentioned in text, must be in allowed set
  for (const product of catalog.products) {
    const norm = normalizeSku(product.sku);
    if (norm.length >= 2) {
      // Look for the product SKU as a discrete token or normalized substring
      const skuPattern = new RegExp(`\\b${product.sku.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}\\b`, "i");
      if (skuPattern.test(outputAnswer)) {
        if (!allowedNormalizedSkus.has(norm)) {
          violations.push(
            `Unauthorized catalog SKU "${product.sku}" referenced (not in retrieved set or recent turns)`
          );
          offendingTokens.push(product.sku);
        }
      }
    }
  }

  // Also check for fabricated SKU patterns (e.g., ABC-9999) not present anywhere in catalog
  const catalogNormalizedSkus = new Set(catalog.products.map((p) => normalizeSku(p.sku)));
  const genericSkuRegex = /\b[A-Za-z]{2,5}-\d{3,4}(?:-[A-Za-z0-9]+)?\b/g;
  const genericMatches = outputAnswer.match(genericSkuRegex) || [];
  for (const m of genericMatches) {
    const norm = normalizeSku(m);
    if (!catalogNormalizedSkus.has(norm)) {
      violations.push(`Fabricated or uncataloged SKU pattern detected: "${m}"`);
      offendingTokens.push(m);
    }
  }

  // 3. Validate money amounts
  // Collect all valid prices from retrieved rows and computed facts
  const validPrices: number[] = [];
  for (const p of retrievedProducts) {
    if (p.price !== null) validPrices.push(p.price);
  }
  for (const fact of computedFacts) {
    const factAmounts = extractMoneyAmounts(fact);
    validPrices.push(...factAmounts);
  }

  const mentionedMoney = extractMoneyAmounts(outputAnswer);
  for (const money of mentionedMoney) {
    const matchesValid = validPrices.some((vp) => Math.abs(vp - money) < 0.01);
    if (!matchesValid) {
      violations.push(`Fabricated or unauthorized price: $${money.toFixed(2)} USD`);
      offendingTokens.push(`$${money.toFixed(2)}`);
    }
  }

  // 4. Validate numbers with units
  // Build a single search string from retrieved products and computed facts
  const contextCorpus = [
    ...retrievedProducts.map((p) => [p.name, p.priceDisplay, ...Object.values(p.specs)].join(" ")),
    ...computedFacts,
  ]
    .join(" ")
    .toLowerCase();

  const unitExpressions = extractNumbersWithUnits(outputAnswer);
  for (const expr of unitExpressions) {
    const cleanExpr = expr.raw.toLowerCase();
    // Check if the number followed by unit appears in context corpus
    if (!contextCorpus.includes(cleanExpr) && !contextCorpus.includes(`${expr.num}${expr.unit}`) && !contextCorpus.includes(`${expr.num} ${expr.unit}`)) {
      violations.push(`Unverified unit specification: "${expr.raw}"`);
      offendingTokens.push(expr.raw);
    }
  }

  const isValid = violations.length === 0;

  let correctivePrompt: string | undefined;
  if (!isValid) {
    correctivePrompt = `Your previous answer contained unverified or hallucinated elements that failed our deterministic validation gate: [${offendingTokens.join(
      ", "
    )}]. Rewrite your answer referencing ONLY facts, SKUs, and prices explicitly listed in <catalog_data> and <computed_facts>. Omit any unverified claims.`;
  }

  return {
    isValid,
    violations,
    offendingTokens,
    correctivePrompt,
  };
}
