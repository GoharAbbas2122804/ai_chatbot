import MiniSearch from "minisearch";
import { CONFIG } from "../config";
import type { CatalogData, CatalogProduct } from "../catalog/schema";

interface IndexedProductDoc {
  id: string; // SKU
  sku: string;
  name: string;
  category: string;
  searchText: string;
}

interface IndexCache {
  version: string | null;
  instance: MiniSearch<IndexedProductDoc> | null;
  skuMap: Map<string, CatalogProduct>;
  normalizedSkuMap: Map<string, CatalogProduct>;
}

const indexCache: IndexCache = {
  version: null,
  instance: null,
  skuMap: new Map(),
  normalizedSkuMap: new Map(),
};

/**
 * Normalizes SKU by lowercasing and stripping whitespace, dashes, underscores, and dots.
 * E.g., "ab 123", "AB-123", "ab_123", "AB.123" all normalize to "ab123".
 */
export function normalizeSku(raw: string): string {
  if (!raw) return "";
  return raw.toLowerCase().replace(/[\s\-_.]/g, "");
}

/**
 * Ensures a MiniSearch index is built and cached for the provided catalog version.
 */
export function getOrBuildSearchIndex(catalog: CatalogData): {
  miniSearch: MiniSearch<IndexedProductDoc>;
  skuMap: Map<string, CatalogProduct>;
  normalizedSkuMap: Map<string, CatalogProduct>;
} {
  if (
    indexCache.instance &&
    indexCache.version === catalog.version &&
    indexCache.skuMap.size > 0
  ) {
    return {
      miniSearch: indexCache.instance,
      skuMap: indexCache.skuMap,
      normalizedSkuMap: indexCache.normalizedSkuMap,
    };
  }

  const skuMap = new Map<string, CatalogProduct>();
  const normalizedSkuMap = new Map<string, CatalogProduct>();

  const documents: IndexedProductDoc[] = catalog.products.map((p) => {
    skuMap.set(p.sku.toUpperCase(), p);
    normalizedSkuMap.set(normalizeSku(p.sku), p);

    // Concatenate all columns and spec attributes into a single text blob
    const specEntries = Object.entries(p.specs)
      .map(([k, v]) => `${k}: ${v}`)
      .join(" ");

    const searchText = [
      p.sku,
      p.name,
      p.category,
      p.priceDisplay,
      specEntries,
    ].join(" ");

    return {
      id: p.sku,
      sku: p.sku,
      name: p.name,
      category: p.category,
      searchText,
    };
  });

  const miniSearch = new MiniSearch<IndexedProductDoc>({
    fields: ["sku", "name", "searchText"],
    storeFields: ["id", "sku", "name", "category"],
    searchOptions: {
      boost: {
        sku: CONFIG.RETRIEVAL.BOOST_SKU,
        name: CONFIG.RETRIEVAL.BOOST_NAME,
      },
      prefix: CONFIG.RETRIEVAL.PREFIX,
      fuzzy: CONFIG.RETRIEVAL.FUZZY,
    },
  });

  miniSearch.addAll(documents);

  // Update singleton cache
  indexCache.instance = miniSearch;
  indexCache.version = catalog.version;
  indexCache.skuMap = skuMap;
  indexCache.normalizedSkuMap = normalizedSkuMap;

  return {
    miniSearch,
    skuMap,
    normalizedSkuMap,
  };
}
