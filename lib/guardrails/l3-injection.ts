import { CONFIG } from "../config";
import { env } from "../env";

export interface HeuristicScreenResult {
  action: "proceed" | "blocked" | "static_reply";
  staticReply?: string;
  matchedPattern?: string;
}

/**
 * ARCHITECTURAL SECURITY NOTE:
 * Regex heuristics are merely a front-line speed bump to deflect obvious adversarial probing
 * and reduce inference expenditure. The authentic security posture of INDEX is architectural:
 * 1. The model has zero tools and zero access to underlying execution systems.
 * 2. Zero confidential system secrets or API keys are ever placed in prompts.
 * 3. Output validation (Layer 6) strictly rejects any hallucinated SKUs or unauthorized facts.
 */
const INJECTION_PATTERNS = [
  /\bignore\s+(?:all\s+)?(?:previous|prior|above)\s+(?:instructions|prompts|rules)\b/i,
  /\b(?:reveal|show|print|display|dump)\s+(?:your\s+)?(?:system\s+)?(?:prompt|instructions|rules)\b/i,
  /\bwhat\s+(?:are|is)\s+your\s+(?:system\s+)?(?:prompt|instructions|rules)\b/i,
  /\b(?:enter|enable)\s+(?:developer|dan|jailbreak|unrestricted)\s+mode\b/i,
  /\bact\s+as\s+(?:an?\s+)?(?:unfiltered|jailbroken|evil|unrestricted)\b/i,
  /\bdisregard\s+(?:the\s+)?(?:catalog|rules|instructions)\b/i,
  /\brepeat\s+everything\s+(?:above|from\s+the\s+beginning)\b/i,
];

// Base64 or long encoded blob pattern: continuous alphanumeric strings > 120 chars without spaces
const ENCODED_BLOB_REGEX = new RegExp(`\\b[A-Za-z0-9+/=]{${CONFIG.L3.MAX_ENCODED_TOKEN_LENGTH},}\\b`);

// Greetings & pleasantries patterns for static short-circuiting
const GREETING_REGEX = /^(?:hi|hello|hey|greetings|good\s+(?:morning|afternoon|evening)|howdy)\b/i;
const THANKS_REGEX = /^(?:thank\s+you|thanks|thx|appreciate\s+it|ty)\b/i;

/**
 * L3 Heuristic Injection & Off-Topic Screen
 */
export function screenMessageHeuristics(message: string): HeuristicScreenResult {
  const trimmed = message.trim();

  // 1. Check for instruction override / extraction heuristics
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        action: "blocked",
        matchedPattern: pattern.source,
        staticReply: `I am the product assistant for ${env.COMPANY_NAME}. I answer questions strictly about our product catalog (pricing, specifications, availability, and comparisons). How can I assist you with our products today?`,
      };
    }
  }

  // 2. Check for suspicious base64 / encoded payload blobs
  if (ENCODED_BLOB_REGEX.test(trimmed)) {
    return {
      action: "blocked",
      matchedPattern: "ENCODED_BLOB",
      staticReply: `I can only process product inquiries, part numbers, and specifications. Please provide a standard product name, SKU, or specification question.`,
    };
  }

  // 3. Static short-circuit for common greetings (saves LLM compute)
  if (trimmed.length < 35 && GREETING_REGEX.test(trimmed)) {
    return {
      action: "static_reply",
      staticReply: `Hello! I am the ${env.COMPANY_NAME} catalog assistant. Ask me about product prices, technical specifications, SKU lookups, or multi-item comparisons.`,
    };
  }

  // 4. Static short-circuit for thanks / closing pleasantries
  if (trimmed.length < 35 && THANKS_REGEX.test(trimmed)) {
    return {
      action: "static_reply",
      staticReply: `You're welcome! Let me know if you need any other specifications, pricing details, or SKU comparisons for ${env.COMPANY_NAME} products.`,
    };
  }

  return { action: "proceed" };
}
