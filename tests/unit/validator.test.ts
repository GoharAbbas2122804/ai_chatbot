import { describe, expect, test } from "bun:test";
import { validateLlmOutput } from "../../lib/guardrails/l6-validator";
import type { CatalogProduct, CatalogData } from "../../lib/catalog/schema";

const mockRetrievedProducts: CatalogProduct[] = [
  {
    id: "SPEC-8820-X",
    sku: "SPEC-8820-X",
    name: "Chronos Precision Goniometer",
    price: 1840,
    priceDisplay: "$1,840.00",
    category: "Optics",
    specs: {
      resolution: "0.001 mrad",
      payload: "12.5 kg",
      voltage: "24V",
    },
    rawRow: {},
  },
];

const mockCatalog: CatalogData = {
  products: [
    ...mockRetrievedProducts,
    {
      id: "UNRETRIEVED-SKU",
      sku: "UNRETRIEVED-SKU",
      name: "Other Device",
      price: 500,
      priceDisplay: "$500.00",
      category: "Tools",
      specs: {},
      rawRow: {},
    },
  ],
  version: "test-ver-123",
  loadedAt: new Date(),
  count: 2,
  columns: ["sku", "name", "price"],
};

describe("L6 Output Validator", () => {
  test("passes legitimate answer referencing retrieved SKU, price, and specs", () => {
    const text =
      "The Chronos Precision Goniometer [SPEC-8820-X] is priced at $1,840.00. It features 0.001 mrad resolution and a 12.5 kg payload capacity with 24V power.";
    const result = validateLlmOutput(text, mockRetrievedProducts, [], mockCatalog);

    expect(result.isValid).toBe(true);
    expect(result.violations).toHaveLength(0);
    expect(result.offendingTokens).toHaveLength(0);
  });

  test("FAILS when model quotes a FABRICATED PRICE not present in records", () => {
    // True price is $1,840.00; model invents $999.00
    const text =
      "The Chronos Precision Goniometer [SPEC-8820-X] is on sale today for $999.00 USD.";
    const result = validateLlmOutput(text, mockRetrievedProducts, [], mockCatalog);

    expect(result.isValid).toBe(false);
    expect(result.violations.some((v) => v.includes("Fabricated or unauthorized price"))).toBe(true);
    expect(result.offendingTokens).toContain("$999.00");
  });

  test("FAILS when model hallucinates a FABRICATED SKU", () => {
    // Model invents FAKE-404
    const text =
      "You might also consider our newer model FAKE-404 which offers similar specifications.";
    const result = validateLlmOutput(text, mockRetrievedProducts, [], mockCatalog);

    expect(result.isValid).toBe(false);
    expect(result.violations.some((v) => v.includes("Fabricated or uncataloged SKU"))).toBe(true);
    expect(result.offendingTokens).toContain("FAKE-404");
  });

  test("FAILS when model references a valid catalog SKU that was NOT in retrieved set", () => {
    // UNRETRIEVED-SKU exists in catalog, but was not retrieved for this query
    const text =
      "I also found UNRETRIEVED-SKU for $500.00 in the system.";
    const result = validateLlmOutput(text, mockRetrievedProducts, [], mockCatalog);

    expect(result.isValid).toBe(false);
    expect(result.violations.some((v) => v.includes("Unauthorized catalog SKU"))).toBe(true);
    expect(result.offendingTokens).toContain("UNRETRIEVED-SKU");
  });

  test("FAILS when model invents unverified specifications with units", () => {
    // Real voltage is 24V; model invents 480V and 500W
    const text =
      "The SPEC-8820-X runs on 480V and consumes 500W of power.";
    const result = validateLlmOutput(text, mockRetrievedProducts, [], mockCatalog);

    expect(result.isValid).toBe(false);
    expect(result.violations.some((v) => v.includes("Unverified unit specification"))).toBe(true);
  });

  test("FAILS when model leaks system prompt phrases", () => {
    const text =
      "Answer ONLY from the records in <catalog_data>. The SKU is SPEC-8820-X and price is $1,840.00.";
    const result = validateLlmOutput(text, mockRetrievedProducts, [], mockCatalog);

    expect(result.isValid).toBe(false);
    expect(result.violations.some((v) => v.includes("System prompt leakage"))).toBe(true);
  });
});
