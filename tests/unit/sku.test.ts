import { describe, expect, test } from "bun:test";
import { normalizeSku } from "../../lib/retrieval/minisearch";

describe("SKU Normalization", () => {
  test("normalizes diverse whitespace and punctuation formats", () => {
    expect(normalizeSku("ab 123")).toBe("ab123");
    expect(normalizeSku("AB-123")).toBe("ab123");
    expect(normalizeSku("ab_123")).toBe("ab123");
    expect(normalizeSku("AB.123")).toBe("ab123");
    expect(normalizeSku("SPEC-8820-X")).toBe("spec8820x");
    expect(normalizeSku("spec 8820 x")).toBe("spec8820x");
    expect(normalizeSku("  OPT - 400 . ")).toBe("opt400");
  });

  test("handles empty and single character strings safely", () => {
    expect(normalizeSku("")).toBe("");
    expect(normalizeSku("-")).toBe("");
    expect(normalizeSku("X")).toBe("x");
  });
});
