import { describe, expect, test, beforeAll } from "bun:test";
import { defaultRetriever } from "../../lib/retrieval/retriever";
import { getCatalog, resetCatalogCache } from "../../lib/catalog/loader";
import type { CatalogData } from "../../lib/catalog/schema";

describe("MiniSearch Retriever", () => {
  let catalog: CatalogData;

  beforeAll(async () => {
    resetCatalogCache();
    process.env.CATALOG_CSV_URL = "file://tests/fixtures/catalog.csv";
    catalog = await getCatalog(true);
  });

  test("exact SKU lookup yields 'exact' confidence with matching product", async () => {
    const result = await defaultRetriever.retrieve("What is the price of SPEC-8820-X?", [], catalog);
    expect(result.confidence).toBe("exact");
    expect(result.products.length).toBeGreaterThan(0);
    expect(result.products[0].sku).toBe("SPEC-8820-X");
    expect(result.resolvedSkus).toContain("SPEC-8820-X");
  });

  test("comparison query resolves both candidates and computes price delta", async () => {
    const result = await defaultRetriever.retrieve("Compare OPT-400 vs OPT-450", [], catalog);
    expect(result.confidence).toBe("exact");
    expect(result.resolvedSkus).toContain("OPT-400");
    expect(result.resolvedSkus).toContain("OPT-450");
    expect(result.computedFacts.some((f) => f.includes("660.00 USD"))).toBe(true);
  });

  test("budget query returns filtered set within budget cap", async () => {
    const result = await defaultRetriever.retrieve("show me lenses under $200", [], catalog);
    expect(result.products.length).toBeGreaterThan(0);
    for (const p of result.products) {
      if (p.price !== null) {
        expect(p.price).toBeLessThanOrEqual(200);
      }
    }
  });

  test("follow-up pronoun query resolves SKU from recent conversation history", async () => {
    const history = [
      { role: "user" as const, content: "Tell me about MOD-770" },
      { role: "assistant" as const, content: "The MOD-770 is a Sub-Nanometer Piezo Actuator Module priced at $3,420.00." },
    ];

    const result = await defaultRetriever.retrieve("What is the lead time for it?", history, catalog);
    expect(result.resolvedSkus).toContain("MOD-770");
  });

  test("out of scope gibberish returns 'none' or 'low' confidence", async () => {
    const result = await defaultRetriever.retrieve("tell me a fairy tale about dragons", [], catalog);
    expect(result.confidence === "none" || result.confidence === "low").toBe(true);
  });
});
