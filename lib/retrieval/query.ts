import type { CatalogProduct, CatalogData } from "../catalog/schema";
import { normalizeSku } from "./minisearch";
import type { ChatMessageContext } from "./types";

export interface ParsedQuery {
  raw: string;
  normalizedText: string;
  exactMatchedProducts: CatalogProduct[];
  isComparison: boolean;
  comparisonCandidates: CatalogProduct[];
  budgetFilter?: {
    type: "under" | "over" | "between";
    min?: number;
    max?: number;
  };
  superlative?: "cheapest" | "most_expensive";
  followUpCandidateSkus: string[];
}

/**
 * Extracts candidate SKU tokens from user prompt and matches against normalized catalog SKU map.
 */
export function extractAndResolveSkus(
  text: string,
  normalizedSkuMap: Map<string, CatalogProduct>
): CatalogProduct[] {
  const matches = new Set<CatalogProduct>();

  // Regex pattern for SKU-like tokens: alphanumeric sequences with optional hyphens/underscores/dots
  const skuTokenRegex = /\b[A-Za-z0-9]+(?:[\-_.\s][A-Za-z0-9]+)*\b/g;
  const tokens = text.match(skuTokenRegex) || [];

  for (const token of tokens) {
    const norm = normalizeSku(token);
    if (norm.length >= 2 && normalizedSkuMap.has(norm)) {
      matches.add(normalizedSkuMap.get(norm)!);
    }
  }

  // Also check direct substring of normalized text
  const cleanFull = normalizeSku(text);
  for (const [normSku, product] of normalizedSkuMap.entries()) {
    if (normSku.length >= 3 && cleanFull.includes(normSku)) {
      matches.add(product);
    }
  }

  return Array.from(matches);
}

/**
 * Extracts SKUs referenced in previous conversation turns.
 */
export function extractSkusFromHistory(
  history: ChatMessageContext[],
  normalizedSkuMap: Map<string, CatalogProduct>,
  turnsToExamine = 2
): string[] {
  const foundSkus = new Set<string>();
  const recentTurns = history.slice(-turnsToExamine * 2);

  for (const msg of recentTurns) {
    const products = extractAndResolveSkus(msg.content, normalizedSkuMap);
    for (const p of products) {
      foundSkus.add(p.sku);
    }
  }

  return Array.from(foundSkus);
}

/**
 * Detects comparison intent between products or SKUs.
 * Patterns: "compare X and Y", "X vs Y", "difference between X and Y", "X or Y".
 */
export function detectComparisonIntent(
  text: string,
  products: CatalogProduct[],
  normalizedSkuMap: Map<string, CatalogProduct>
): { isComparison: boolean; candidates: CatalogProduct[] } {
  const lower = text.toLowerCase();
  const comparisonKeywords = ["compare", " vs ", " vs. ", " versus ", "difference between", "better than", "which one", " or "];
  const hasKeyword = comparisonKeywords.some((kw) => lower.includes(kw));

  if (!hasKeyword) {
    return { isComparison: false, candidates: [] };
  }

  // Check resolved exact products from text
  const directMatches = extractAndResolveSkus(text, normalizedSkuMap);
  if (directMatches.length >= 2) {
    return { isComparison: true, candidates: directMatches.slice(0, 2) };
  }

  // Check if product names appear in query
  const nameMatches: CatalogProduct[] = [];
  for (const product of products) {
    const nameLower = product.name.toLowerCase();
    if (lower.includes(nameLower) || (nameLower.length > 5 && lower.includes(nameLower.slice(0, -2)))) {
      if (!nameMatches.some((p) => p.sku === product.sku)) {
        nameMatches.push(product);
      }
    }
  }

  if (nameMatches.length >= 2) {
    return { isComparison: true, candidates: nameMatches.slice(0, 2) };
  }

  return { isComparison: hasKeyword, candidates: directMatches };
}

/**
 * Parses budget constraints like:
 * - "under $50", "below 100", "less than 200"
 * - "over $1000", "above 500", "more than 300"
 * - "between $50 and $100", "between 20 and 40"
 */
export function parseBudgetFilter(text: string): ParsedQuery["budgetFilter"] {
  const lower = text.toLowerCase();

  // Between pattern
  const betweenMatch = lower.match(/between\s+\$?([\d,]+(?:\.\d+)?)\s+(?:and|to|-)\s+\$?([\d,]+(?:\.\d+)?)/);
  if (betweenMatch) {
    const min = parseFloat(betweenMatch[1].replace(/,/g, ""));
    const max = parseFloat(betweenMatch[2].replace(/,/g, ""));
    if (!isNaN(min) && !isNaN(max)) {
      return { type: "between", min: Math.min(min, max), max: Math.max(min, max) };
    }
  }

  // Under / below / less than
  const underMatch = lower.match(/(?:under|below|less than|up to|cheaper than|max)\s+\$?([\d,]+(?:\.\d+)?)/);
  if (underMatch) {
    const max = parseFloat(underMatch[1].replace(/,/g, ""));
    if (!isNaN(max)) {
      return { type: "under", max };
    }
  }

  // Over / above / more than
  const overMatch = lower.match(/(?:over|above|more than|exceeding|at least|min)\s+\$?([\d,]+(?:\.\d+)?)/);
  if (overMatch) {
    const min = parseFloat(overMatch[1].replace(/,/g, ""));
    if (!isNaN(min)) {
      return { type: "over", min };
    }
  }

  return undefined;
}

/**
 * Parses superlative intent (cheapest, most expensive, top end).
 */
export function parseSuperlative(text: string): "cheapest" | "most_expensive" | undefined {
  const lower = text.toLowerCase().replace(/[-_]/g, " ");
  if (
    lower.includes("cheapest") ||
    lower.includes("least expensive") ||
    lower.includes("lowest price") ||
    lower.includes("budget option")
  ) {
    return "cheapest";
  }

  if (
    lower.includes("most expensive") ||
    lower.includes("highest price") ||
    lower.includes("top of the line") ||
    lower.includes("premium option") ||
    lower.includes("premium")
  ) {
    return "most_expensive";
  }

  return undefined;
}

/**
 * Follow-up detection: checks if query is short or uses pronouns ("it", "that one", "the cheaper one").
 */
export function isFollowUpQuery(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 35) return true;

  const lower = trimmed.toLowerCase();
  const pronouns = ["it", "this", "that", "that one", "this one", "the cheaper one", "the other one", "its", "them"];
  return pronouns.some((p) => new RegExp(`\\b${p}\\b`, "i").test(lower));
}

/**
 * Computes deterministic facts in code so LLM never does arithmetic itself.
 */
export function generateComputedFacts(
  products: CatalogProduct[],
  parsedQuery: ParsedQuery
): string[] {
  const facts: string[] = [];

  // Comparison facts
  if (parsedQuery.isComparison && parsedQuery.comparisonCandidates.length >= 2) {
    const [p1, p2] = parsedQuery.comparisonCandidates;
    if (p1.price !== null && p2.price !== null) {
      const diff = Math.abs(p1.price - p2.price);
      const cheaper = p1.price < p2.price ? p1 : p2;
      const expensive = p1.price > p2.price ? p1 : p2;

      facts.push(
        `Price difference between ${p1.sku} (${p1.priceDisplay}) and ${p2.sku} (${p2.priceDisplay}) = ${diff.toFixed(
          2
        )} USD.`
      );
      facts.push(
        `The more affordable option is ${cheaper.sku} at ${cheaper.priceDisplay}; the higher-priced option is ${expensive.sku} at ${expensive.priceDisplay}.`
      );
    }
  }

  // Superlative facts
  if (parsedQuery.superlative && products.length > 0) {
    const priced = products.filter((p) => p.price !== null) as (CatalogProduct & { price: number })[];
    if (priced.length > 0) {
      if (parsedQuery.superlative === "cheapest") {
        const sorted = [...priced].sort((a, b) => a.price - b.price);
        const cheapest = sorted[0];
        facts.push(`Lowest priced product in this set is ${cheapest.name} (SKU: ${cheapest.sku}) at ${cheapest.priceDisplay}.`);
      } else if (parsedQuery.superlative === "most_expensive") {
        const sorted = [...priced].sort((a, b) => b.price - a.price);
        const top = sorted[0];
        facts.push(
          `Highest priced product in this set is ${top.name} (SKU: ${top.sku}) at ${top.priceDisplay}.`
        );
      }
    }
  }

  // Budget facts
  if (parsedQuery.budgetFilter) {
    const { type, min, max } = parsedQuery.budgetFilter;
    const filterDesc =
      type === "under"
        ? `under $${max}`
        : type === "over"
        ? `over $${min}`
        : `between $${min} and $${max}`;

    const matching = products.filter((p) => {
      if (p.price === null) return false;
      if (type === "under") return p.price <= (max ?? Infinity);
      if (type === "over") return p.price >= (min ?? 0);
      return p.price >= (min ?? 0) && p.price <= (max ?? Infinity);
    });

    if (matching.length > 0) {
      facts.push(
        `Found ${matching.length} product(s) matching budget ${filterDesc}: ${matching
          .map((m) => `${m.sku} (${m.priceDisplay})`)
          .join(", ")}.`
      );
    } else {
      facts.push(`No products in the active catalog match the budget filter ${filterDesc}.`);
    }
  }

  return facts;
}

/**
 * High-level query analysis function.
 */
export function analyzeQuery(
  text: string,
  history: ChatMessageContext[],
  catalog: CatalogData,
  normalizedSkuMap: Map<string, CatalogProduct>
): ParsedQuery {
  const exactMatched = extractAndResolveSkus(text, normalizedSkuMap);
  const comparison = detectComparisonIntent(text, catalog.products, normalizedSkuMap);
  const budget = parseBudgetFilter(text);
  const superlative = parseSuperlative(text);

  let followUpSkus: string[] = [];
  if (isFollowUpQuery(text)) {
    followUpSkus = extractSkusFromHistory(history, normalizedSkuMap, 2);
  }

  return {
    raw: text,
    normalizedText: text.trim().toLowerCase(),
    exactMatchedProducts: exactMatched,
    isComparison: comparison.isComparison,
    comparisonCandidates: comparison.candidates,
    budgetFilter: budget,
    superlative,
    followUpCandidateSkus: followUpSkus,
  };
}
