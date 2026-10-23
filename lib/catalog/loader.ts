import fs from "fs/promises";
import Papa from "papaparse";
import { CONFIG } from "../config";
import { env } from "../env";
import { type CatalogData, parseCatalogRows } from "./schema";

export class CatalogUnavailableError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "CatalogUnavailableError";
  }
}

interface CacheState {
  catalog: CatalogData | null;
  lastAttemptAt: number;
  lastSuccessAt: number;
  lastError: Error | null;
}

const cacheState: CacheState = {
  catalog: null,
  lastAttemptAt: 0,
  lastSuccessAt: 0,
  lastError: null,
};

/**
 * Fetches the raw CSV content from URL (HTTP/HTTPS) or local file path (file:// or local path).
 */
async function fetchRawCsv(sourceUrl: string, timeoutMs: number): Promise<string> {
  if (sourceUrl.startsWith("file://") || sourceUrl.startsWith("./") || sourceUrl.startsWith("/")) {
    const filePath = sourceUrl.replace(/^file:\/\//, "");
    return await fs.readFile(filePath, "utf-8");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(sourceUrl, {
      signal: controller.signal,
      headers: {
        Accept: "text/csv, text/plain;q=0.9, */*;q=0.8",
        "User-Agent": "IndexProductCatalogBot/1.0",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText} fetching catalog from ${sourceUrl}`);
    }

    return await response.text();
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Timed out after ${timeoutMs}ms fetching catalog from ${sourceUrl}`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Parses raw CSV string using PapaParse.
 */
function parseCsvToRecords(csvText: string): Record<string, string>[] {
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (header: string) => header.trim().toLowerCase(),
  });

  if (parsed.errors && parsed.errors.length > 0) {
    const criticalErrors = parsed.errors.filter((e) => e.type !== "FieldMismatch");
    if (criticalErrors.length > 0) {
      throw new Error(`CSV Parsing syntax error: ${criticalErrors.map((e) => e.message).join("; ")}`);
    }
  }

  return parsed.data;
}

/**
 * Retrieves the catalog from cache or reloads if expired or forced.
 * Implements Stale-While-Error semantics: returns cached copy if reload fails.
 */
export async function getCatalog(forceRefresh = false): Promise<CatalogData> {
  const now = Date.now();
  const ttlMs = (env.CATALOG_TTL_SECONDS || CONFIG.CATALOG.DEFAULT_TTL_SECONDS) * 1000;
  const isCacheValid = cacheState.catalog !== null && now - cacheState.lastSuccessAt < ttlMs;

  if (!forceRefresh && isCacheValid && cacheState.catalog) {
    return cacheState.catalog;
  }

  // Rate-limit retries on failure: wait RETRY_INTERVAL_MS before attempting reload again
  if (!forceRefresh && cacheState.lastError && now - cacheState.lastAttemptAt < CONFIG.CATALOG.RETRY_INTERVAL_MS) {
    if (cacheState.catalog) {
      return cacheState.catalog;
    }
  }

  cacheState.lastAttemptAt = now;

  let sourceUrl = process.env.CATALOG_CSV_URL || env.CATALOG_CSV_URL;
  let isFixture = false;

  if (
    !sourceUrl ||
    sourceUrl.includes("raw.githubusercontent.com/test/catalog") ||
    sourceUrl.includes("docs.google.com/spreadsheets/d/e/2PACX-1vT.../pub")
  ) {
    if (process.env.NODE_ENV !== "production") {
      sourceUrl = "file://tests/fixtures/catalog.csv";
      isFixture = true;
    }
  }

  if (sourceUrl.includes("fixtures/catalog.csv")) {
    isFixture = true;
  }

  try {
    const csvText = await fetchRawCsv(sourceUrl, CONFIG.CATALOG.FETCH_TIMEOUT_MS);
    const records = parseCsvToRecords(csvText);
    const catalogData = parseCatalogRows(records, csvText);
    catalogData.isFixture = isFixture;

    // Success: update cache
    cacheState.catalog = catalogData;
    cacheState.lastSuccessAt = now;
    cacheState.lastError = null;

    return catalogData;
  } catch (err: unknown) {
    if (process.env.NODE_ENV !== "production" && !sourceUrl.startsWith("file://")) {
      console.warn("[CatalogLoader] Fetch failed, loading fixture catalog.csv for development mode.");
      try {
        const fixtureText = await fetchRawCsv("file://tests/fixtures/catalog.csv", CONFIG.CATALOG.FETCH_TIMEOUT_MS);
        const records = parseCsvToRecords(fixtureText);
        const catalogData = parseCatalogRows(records, fixtureText);
        catalogData.isFixture = true;
        cacheState.catalog = catalogData;
        cacheState.lastSuccessAt = now;
        cacheState.lastError = null;
        return catalogData;
      } catch (fixtureErr) {
        console.error("[CatalogLoader] Fixture fallback also failed:", fixtureErr);
      }
    }

    const error = err instanceof Error ? err : new Error(String(err));
    cacheState.lastError = error;

    console.warn(
      `[CatalogLoader] Warning: Failed to refresh catalog (${error.message}). Checking stale-while-error cache.`
    );

    // Stale-While-Error: Serve existing catalog if available
    if (cacheState.catalog) {
      console.warn(`[CatalogLoader] Serving stale catalog (version: ${cacheState.catalog.version.substring(0, 8)}).`);
      return cacheState.catalog;
    }

    // No fallback available: throw CatalogUnavailableError
    throw new CatalogUnavailableError(
      `Catalog data source is currently unavailable and no cached version exists: ${error.message}`,
      error
    );
  }
}

/**
 * Reset loader cache (used primarily in test suites).
 */
export function resetCatalogCache(): void {
  cacheState.catalog = null;
  cacheState.lastAttemptAt = 0;
  cacheState.lastSuccessAt = 0;
  cacheState.lastError = null;
}

/**
 * Injects a catalog directly into cache (useful for offline unit testing).
 */
export function injectCatalogForTesting(catalog: CatalogData): void {
  cacheState.catalog = catalog;
  cacheState.lastSuccessAt = Date.now();
  cacheState.lastAttemptAt = Date.now();
  cacheState.lastError = null;
}
