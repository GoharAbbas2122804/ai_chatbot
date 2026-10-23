import { CONFIG } from "../config";
import type { CatalogData, CatalogProduct } from "../catalog/schema";
import { getOrBuildSearchIndex } from "./minisearch";
import { analyzeQuery, generateComputedFacts } from "./query";
import type {
  Retriever,
  RetrievalResult,
  RetrievalConfidence,
  ChatMessageContext,
} from "./types";

/**
 * Normalizes and stems common English plurals for catalog retrieval.
 */
function expandSearchTerms(text: string): string {
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2);

  const stemmed = tokens.map((t) => {
    if (t.endsWith("ies")) return t.slice(0, -3) + "y";
    if (t.endsWith("es") && !t.endsWith("ses")) return t.slice(0, -2);
    if (t.endsWith("s") && !t.endsWith("ss")) return t.slice(0, -1);
    return t;
  });

  return Array.from(new Set([...tokens, ...stemmed])).join(" ");
}

export class MiniSearchRetriever implements Retriever {
  async retrieve(
    queryText: string,
    history: ChatMessageContext[],
    catalog: CatalogData
  ): Promise<RetrievalResult> {
    const { miniSearch, skuMap, normalizedSkuMap } = getOrBuildSearchIndex(catalog);
    const parsed = analyzeQuery(queryText, history, catalog, normalizedSkuMap);

    const candidateProducts: CatalogProduct[] = [];
    const seenSkus = new Set<string>();

    let topScore = 0;
    let confidence: RetrievalConfidence = "none";

    // 1. Exact SKU matches always win
    for (const p of parsed.exactMatchedProducts) {
      if (!seenSkus.has(p.sku)) {
        seenSkus.add(p.sku);
        candidateProducts.push(p);
      }
    }

    // 2. Comparison candidates if detected
    for (const p of parsed.comparisonCandidates) {
      if (!seenSkus.has(p.sku)) {
        seenSkus.add(p.sku);
        candidateProducts.push(p);
      }
    }

    // 3. Follow-up candidates from recent history
    for (const sku of parsed.followUpCandidateSkus) {
      const p = skuMap.get(sku.toUpperCase());
      if (p && !seenSkus.has(p.sku)) {
        seenSkus.add(p.sku);
        candidateProducts.push(p);
      }
    }

    // 4. MiniSearch full-text query with term expansion
    const expandedQuery = expandSearchTerms(queryText);
    const searchResults = miniSearch.search(expandedQuery || queryText);
    if (searchResults.length > 0) {
      topScore = searchResults[0].score;
    }

    for (const result of searchResults) {
      const p = skuMap.get(result.id.toUpperCase());
      if (p && !seenSkus.has(p.sku)) {
        seenSkus.add(p.sku);
        candidateProducts.push(p);
      }
      if (candidateProducts.length >= CONFIG.RETRIEVAL.TOP_K * 2) {
        break;
      }
    }

    // 5. Apply budget filtering if requested
    let filteredProducts = candidateProducts;
    if (parsed.budgetFilter) {
      const { type, min, max } = parsed.budgetFilter;
      const satisfiesBudget = (p: CatalogProduct) => {
        if (p.price === null) return false;
        if (type === "under") return p.price <= (max ?? Infinity);
        if (type === "over") return p.price >= (min ?? 0);
        return p.price >= (min ?? 0) && p.price <= (max ?? Infinity);
      };

      let budgetMatches = candidateProducts.filter(satisfiesBudget);

      // If initial search candidate pool missed items, scan catalog matching stemmed keywords
      if (budgetMatches.length === 0) {
        const queryKeywords = expandedQuery.split(" ").filter((w) => w.length > 2);
        budgetMatches = catalog.products.filter((p) => {
          if (!satisfiesBudget(p)) return false;
          const pCorpus = [p.name, p.category, ...Object.values(p.specs)].join(" ").toLowerCase();
          return queryKeywords.some((kw) => pCorpus.includes(kw));
        });
      }

      filteredProducts = budgetMatches;
    }

    // 6. Apply superlative ordering if requested
    if (parsed.superlative) {
      const priced = [...filteredProducts].filter((p) => p.price !== null);
      if (parsed.superlative === "cheapest") {
        priced.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
        filteredProducts = priced;
      } else if (parsed.superlative === "most_expensive") {
        priced.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
        filteredProducts = priced;
      }
    }

    // Slice to maximum TOP_K (never split rows)
    const finalProducts = filteredProducts.slice(0, CONFIG.RETRIEVAL.TOP_K);

    // Compute Confidence
    if (parsed.exactMatchedProducts.length > 0 || parsed.comparisonCandidates.length >= 2) {
      confidence = "exact";
      topScore = Math.max(topScore, 100);
    } else if (finalProducts.length > 0 && parsed.budgetFilter) {
      confidence = "high";
      topScore = Math.max(topScore, 20);
    } else if (topScore >= CONFIG.RETRIEVAL.SCORE_THRESHOLDS.HIGH) {
      confidence = "high";
    } else if (topScore >= CONFIG.RETRIEVAL.SCORE_THRESHOLDS.LOW) {
      confidence = "low";
    } else {
      confidence = "none";
    }

    const computedFacts = generateComputedFacts(finalProducts, parsed);
    const resolvedSkus = finalProducts.map((p) => p.sku);

    return {
      products: finalProducts,
      topScore,
      confidence,
      computedFacts,
      resolvedSkus,
    };
  }
}

export const defaultRetriever: Retriever = new MiniSearchRetriever();
