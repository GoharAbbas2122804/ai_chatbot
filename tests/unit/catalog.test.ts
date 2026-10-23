import { describe, expect, test } from "bun:test";
import { parsePrice, parseCatalogRows, CatalogValidationError } from "../../lib/catalog/schema";
import { getCatalog, resetCatalogCache } from "../../lib/catalog/loader";

describe("Catalog Schema & Price Parser", () => {
  test("parsePrice handles diverse currency symbols and thousands separators", () => {
    expect(parsePrice("$1,840.00")).toEqual({ numeric: 1840, display: "$1,840.00" });
    expect(parsePrice("€ 2,190.50")).toEqual({ numeric: 2190.5, display: "€ 2,190.50" });
    expect(parsePrice("£940")).toEqual({ numeric: 940, display: "£940" });
    expect(parsePrice("3420")).toEqual({ numeric: 3420, display: "3420" });
    expect(parsePrice(null)).toEqual({ numeric: null, display: "N/A" });
    expect(parsePrice("")).toEqual({ numeric: null, display: "N/A" });
    expect(parsePrice("TBD / Contact Sales")).toEqual({ numeric: null, display: "TBD / Contact Sales" });
  });

  test("parseCatalogRows resolves header aliases and preserves specs", () => {
    const rawRows = [
      {
        "item code": "TEST-100",
        "product name": "Precision Optical Mount",
        msrp: "$450.00",
        type: "Mounts",
        tolerance: "±0.001mm",
        coating: "Anodized Black",
      },
    ];

    const catalog = parseCatalogRows(rawRows, "dummy-csv-text");
    expect(catalog.count).toBe(1);
    expect(catalog.products[0].sku).toBe("TEST-100");
    expect(catalog.products[0].name).toBe("Precision Optical Mount");
    expect(catalog.products[0].price).toBe(450);
    expect(catalog.products[0].category).toBe("Mounts");
    expect(catalog.products[0].specs.tolerance).toBe("±0.001mm");
    expect(catalog.products[0].specs.coating).toBe("Anodized Black");
  });

  test("parseCatalogRows skips duplicate SKUs and logs them", () => {
    const rawRows = [
      { sku: "SKU-A", name: "Original Product", price: "100" },
      { sku: "SKU-A", name: "Duplicate Row To Skip", price: "200" },
    ];

    const catalog = parseCatalogRows(rawRows, "dummy-csv");
    expect(catalog.count).toBe(1);
    expect(catalog.products[0].name).toBe("Original Product");
  });

  test("parseCatalogRows throws when invalid row ratio exceeds 20%", () => {
    const rawRows = [
      { sku: "SKU-1", name: "Product 1" },
      { sku: "", name: "Missing SKU" },
      { sku: "SKU-3", name: "" }, // Missing Name
    ];

    expect(() => parseCatalogRows(rawRows, "dummy-csv")).toThrow(CatalogValidationError);
  });
});

describe("Catalog Loader & Fixtures", () => {
  test("loads fixture catalog.csv from file URL cleanly", async () => {
    resetCatalogCache();
    process.env.CATALOG_CSV_URL = "file://tests/fixtures/catalog.csv";
    const catalog = await getCatalog(true);

    expect(catalog.count).toBeGreaterThanOrEqual(14);
    expect(catalog.version).toHaveLength(64); // SHA-256
    const goniometer = catalog.products.find((p) => p.sku === "SPEC-8820-X");
    expect(goniometer).toBeDefined();
    expect(goniometer?.name).toBe("Chronos Quartz-Locked Precision Goniometer");
    expect(goniometer?.price).toBe(1840);
  });
});
