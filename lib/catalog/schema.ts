import { createHash } from "crypto";
import { CONFIG } from "../config";

export interface CatalogProduct {
  id: string; // SKU used as canonical ID
  sku: string;
  name: string;
  price: number | null;
  priceDisplay: string;
  category: string;
  specs: Record<string, string>; // All non-primary columns preserved automatically
  rawRow: Record<string, string>;
}

export interface CatalogData {
  products: CatalogProduct[];
  version: string; // sha256 of raw CSV text
  loadedAt: Date;
  count: number;
  columns: string[];
}

export const HEADER_ALIASES = {
  sku: [
    "sku",
    "item code",
    "item_code",
    "product code",
    "product_code",
    "code",
    "part number",
    "part_number",
    "id",
  ],
  name: [
    "name",
    "product name",
    "product_name",
    "title",
    "item name",
    "item_name",
    "product",
  ],
  price: [
    "price",
    "unit price",
    "unit_price",
    "msrp",
    "cost",
    "retail price",
    "retail_price",
  ],
  category: [
    "category",
    "product category",
    "product_category",
    "type",
    "group",
    "classification",
    "class",
  ],
} as const;

export class CatalogValidationError extends Error {
  constructor(message: string, public readonly invalidCount: number, public readonly totalCount: number) {
    super(message);
    this.name = "CatalogValidationError";
  }
}

/**
 * Finds the column in the parsed row that matches any of the canonical aliases.
 */
function findAliasedColumn(headers: string[], aliases: readonly string[]): string | undefined {
  const normalizedHeaders = headers.map((h) => h.trim().toLowerCase());
  for (const alias of aliases) {
    const idx = normalizedHeaders.indexOf(alias);
    if (idx !== -1) {
      return headers[idx];
    }
  }
  return undefined;
}

/**
 * Parses a price string into a float number and canonical display string.
 * Strips currency symbols ($, €, £, ¥, etc.) and commas/spaces.
 */
export function parsePrice(raw: string | undefined | null): { numeric: number | null; display: string } {
  if (!raw || typeof raw !== "string" || !raw.trim()) {
    return { numeric: null, display: "N/A" };
  }

  const trimmed = raw.trim();
  // Strip currency symbols, spaces, and commas
  const cleaned = trimmed.replace(/[^0-9.-]/g, "");
  const num = parseFloat(cleaned);

  if (isNaN(num)) {
    return { numeric: null, display: trimmed };
  }

  return { numeric: num, display: trimmed };
}

/**
 * Validates and transforms raw CSV row records into structured CatalogData.
 */
export function parseCatalogRows(rawRows: Record<string, string>[], csvText: string): CatalogData {
  if (!rawRows || rawRows.length === 0) {
    throw new CatalogValidationError("Catalog CSV contains no rows", 0, 0);
  }

  // Extract columns from the first row keys
  const columns = Object.keys(rawRows[0] || {});
  const skuCol = findAliasedColumn(columns, HEADER_ALIASES.sku);
  const nameCol = findAliasedColumn(columns, HEADER_ALIASES.name);
  const priceCol = findAliasedColumn(columns, HEADER_ALIASES.price);
  const categoryCol = findAliasedColumn(columns, HEADER_ALIASES.category);

  if (!skuCol) {
    throw new CatalogValidationError(
      `Catalog CSV is missing a required SKU column. Known aliases: ${HEADER_ALIASES.sku.join(", ")}`,
      rawRows.length,
      rawRows.length
    );
  }

  if (!nameCol) {
    throw new CatalogValidationError(
      `Catalog CSV is missing a required Name column. Known aliases: ${HEADER_ALIASES.name.join(", ")}`,
      rawRows.length,
      rawRows.length
    );
  }

  const primaryCols = new Set([skuCol, nameCol, priceCol, categoryCol].filter(Boolean) as string[]);
  const specCols = columns.filter((c) => !primaryCols.has(c));

  const seenSkus = new Set<string>();
  const validProducts: CatalogProduct[] = [];
  let invalidRowCount = 0;

  rawRows.forEach((row, index) => {
    const rawSku = (row[skuCol] || "").trim();
    const rawName = (row[nameCol] || "").trim();

    // Required: sku and name
    if (!rawSku || !rawName) {
      console.warn(
        `[Catalog] Row #${index + 1} rejected: Missing required SKU or Name. (sku="${rawSku}", name="${rawName}")`
      );
      invalidRowCount++;
      return;
    }

    // Duplicate SKU: keep first, log the rest
    const skuKey = rawSku.toUpperCase();
    if (seenSkus.has(skuKey)) {
      console.warn(
        `[Catalog] Row #${index + 1} skipped duplicate SKU: "${rawSku}". Keeping earlier entry.`
      );
      return;
    }
    seenSkus.add(skuKey);

    const priceInfo = priceCol ? parsePrice(row[priceCol]) : { numeric: null, display: "N/A" };
    const category = (categoryCol && row[categoryCol] ? row[categoryCol].trim() : "Uncategorized");

    // All other columns preserved as specs
    const specs: Record<string, string> = {};
    for (const specCol of specCols) {
      const val = (row[specCol] || "").trim();
      if (val) {
        specs[specCol] = val;
      }
    }

    validProducts.push({
      id: rawSku,
      sku: rawSku,
      name: rawName,
      price: priceInfo.numeric,
      priceDisplay: priceInfo.display,
      category,
      specs,
      rawRow: row,
    });
  });

  const totalRows = rawRows.length;
  const invalidRatio = totalRows > 0 ? invalidRowCount / totalRows : 1;

  if (invalidRatio > CONFIG.CATALOG.MAX_INVALID_ROW_RATIO) {
    throw new CatalogValidationError(
      `Catalog load rejected: ${invalidRowCount} of ${totalRows} rows (${(invalidRatio * 100).toFixed(
        1
      )}%) are invalid (exceeds ${CONFIG.CATALOG.MAX_INVALID_ROW_RATIO * 100}% threshold)`,
      invalidRowCount,
      totalRows
    );
  }

  const version = createHash("sha256").update(csvText).digest("hex");

  return {
    products: validProducts,
    version,
    loadedAt: new Date(),
    count: validProducts.length,
    columns,
  };
}
