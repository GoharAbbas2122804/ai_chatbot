import { describe, expect, test } from "bun:test";
import {
  parseBudgetFilter,
  parseSuperlative,
  isFollowUpQuery,
  extractAndResolveSkus,
  detectComparisonIntent,
  generateComputedFacts,
} from "../../lib/retrieval/query";
import { normalizeSku } from "../../lib/retrieval/minisearch";
import type { CatalogProduct } from "../../lib/catalog/schema";

const mockProducts: CatalogProduct[] = [
  {
    id: "OPT-400",
    sku: "OPT-400",
    name: "Telecentric Collimator 400mm",
    price: 2190,
    priceDisplay: "$2,190.00",
    category: "Optics",
    specs: {},
    rawRow: {},
  },
  {
    id: "OPT-450",
    sku: "OPT-450",
    name: "Telecentric Collimator 450mm PRO",
    price: 2850,
    priceDisplay: "$2,850.00",
    category: "Optics",
    specs: {},
    rawRow: {},
  },
  {
    id: "LNS-250",
    sku: "LNS-250",
    name: "Plano-Convex Lens 25mm",
    price: 145,
    priceDisplay: "$145.00",
    category: "Optics",
    specs: {},
    rawRow: {},
  },
];

const mockMap = new Map<string, CatalogProduct>();
mockProducts.forEach((p) => mockMap.set(normalizeSku(p.sku), p));

describe("Deterministic Query Parser", () => {
  test("extractAndResolveSkus detects SKU patterns and resolves them", () => {
    const matches = extractAndResolveSkus("What is the lead time for opt 400 and LNS-250?", mockMap);
    expect(matches).toHaveLength(2);
    expect(matches.map((m) => m.sku).sort()).toEqual(["LNS-250", "OPT-400"]);
  });

  test("detectComparisonIntent flags comparison queries and selects candidate pairs", () => {
    const comp1 = detectComparisonIntent("Compare OPT-400 vs OPT-450", mockProducts, mockMap);
    expect(comp1.isComparison).toBe(true);
    expect(comp1.candidates).toHaveLength(2);

    const comp2 = detectComparisonIntent("What is the difference between OPT-400 and OPT-450?", mockProducts, mockMap);
    expect(comp2.isComparison).toBe(true);
  });

  test("parseBudgetFilter identifies under, over, and between conditions", () => {
    expect(parseBudgetFilter("show me items under $500")).toEqual({ type: "under", max: 500 });
    expect(parseBudgetFilter("items below 2000")).toEqual({ type: "under", max: 2000 });
    expect(parseBudgetFilter("products over $1000")).toEqual({ type: "over", min: 1000 });
    expect(parseBudgetFilter("lenses between $100 and $300")).toEqual({ type: "between", min: 100, max: 300 });
  });

  test("parseSuperlative parses cheapest and most expensive intent", () => {
    expect(parseSuperlative("what is the cheapest lens?")).toBe("cheapest");
    expect(parseSuperlative("show me your most expensive collimator")).toBe("most_expensive");
  });

  test("isFollowUpQuery recognizes short queries and pronouns", () => {
    expect(isFollowUpQuery("how much is it?")).toBe(true);
    expect(isFollowUpQuery("what about that one?")).toBe(true);
    expect(isFollowUpQuery("does it have c-mount?")).toBe(true);
    expect(isFollowUpQuery("What are the detailed dimensional specifications and tolerances for the collimators in your warehouse?")).toBe(false);
  });

  test("generateComputedFacts performs exact arithmetic in code", () => {
    const facts = generateComputedFacts(mockProducts, {
      raw: "compare OPT-400 vs OPT-450",
      normalizedText: "compare opt-400 vs opt-450",
      exactMatchedProducts: [mockProducts[0], mockProducts[1]],
      isComparison: true,
      comparisonCandidates: [mockProducts[0], mockProducts[1]],
      followUpCandidateSkus: [],
    });

    expect(facts.length).toBeGreaterThan(0);
    // 2850 - 2190 = 660.00
    expect(facts[0]).toContain("660.00 USD");
    expect(facts[1]).toContain("OPT-400");
  });
});
