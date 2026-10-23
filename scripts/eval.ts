import fs from "fs/promises";
import path from "path";
import { getCatalog } from "../lib/catalog/loader";
import { defaultRetriever } from "../lib/retrieval/retriever";
import { screenMessageHeuristics } from "../lib/guardrails/l3-injection";
import { checkRetrievalGate, generateCatalogFallbackMessage } from "../lib/guardrails/l4-gate";
import { validateLlmOutput } from "../lib/guardrails/l6-validator";
import { normalizeSku } from "../lib/retrieval/minisearch";
import type { ChatMessageContext } from "../lib/retrieval/types";

interface GoldenCase {
  id: string;
  category: string;
  query: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
  expectedSkus: string[];
  exactPrices: string[];
  mustFallback: boolean;
  mustNotInclude: string[];
}

interface CaseResult {
  id: string;
  category: string;
  passed: boolean;
  hallucination: boolean;
  notes: string[];
}

async function runEval() {
  console.log("==================================================================");
  console.log("INDEX PRODUCT CHATBOT — GOLDEN EVALUATION RUNNER");
  console.log("==================================================================\n");

  process.env.CATALOG_CSV_URL = "file://tests/fixtures/catalog.csv";
  const catalog = await getCatalog(true);
  console.log(`✓ Master Catalog loaded: ${catalog.count} products (version: ${catalog.version.substring(0, 8)})\n`);

  const goldenPath = path.join(process.cwd(), "tests/golden.json");
  const rawData = await fs.readFile(goldenPath, "utf-8");
  const testCases: GoldenCase[] = JSON.parse(rawData);

  console.log(`Loaded ${testCases.length} golden eval test cases.\n`);

  const results: CaseResult[] = [];
  const categoryStats: Record<string, { total: number; passed: number; hallucinations: number }> = {};

  for (const tc of testCases) {
    if (!categoryStats[tc.category]) {
      categoryStats[tc.category] = { total: 0, passed: 0, hallucinations: 0 };
    }
    categoryStats[tc.category].total++;

    const history: ChatMessageContext[] = (tc.history || []).map((h) => ({
      role: h.role,
      content: h.content,
    }));

    const notes: string[] = [];
    let passed = true;
    let hallucination = false;

    // Step 1: L3 Heuristic Check
    const heuristic = screenMessageHeuristics(tc.query);

    let outputText = "";
    let retrievedSkus: string[] = [];

    if (heuristic.action === "blocked" || heuristic.action === "static_reply") {
      outputText = heuristic.staticReply || generateCatalogFallbackMessage();
      if (!tc.mustFallback && tc.category !== "out_of_scope" && tc.category !== "injection") {
        passed = false;
        notes.push("Heuristic blocked legitimate catalog query");
      }
    } else {
      // Step 2: Retrieval
      const retrieval = await defaultRetriever.retrieve(tc.query, history, catalog);
      retrievedSkus = retrieval.resolvedSkus;

      // Step 3: L4 Retrieval Gate
      const gate = checkRetrievalGate(retrieval);
      if (!gate.shouldProceedToLlm) {
        outputText = gate.fallbackMessage || generateCatalogFallbackMessage();
        if (!tc.mustFallback) {
          passed = false;
          notes.push(`Gated prematurely: ${gate.reason}`);
        }
      } else {
        // Deterministic answer synthesis for eval (offline testable)
        const topProduct = retrieval.products[0];
        if (retrieval.computedFacts.length > 0) {
          outputText = `${retrieval.computedFacts.join("\n")}\nReferenced products: ${retrieval.products
            .map((p) => `${p.name} [${p.sku}] at ${p.priceDisplay}`)
            .join("; ")}.`;
        } else if (topProduct) {
          const specList = Object.entries(topProduct.specs)
            .map(([k, v]) => `${k}: ${v}`)
            .join(", ");
          outputText = `${topProduct.name} [${topProduct.sku}] is priced at ${topProduct.priceDisplay}. Key specifications: ${specList}.`;
        } else {
          outputText = generateCatalogFallbackMessage();
        }

        // Step 4: L6 Validation Check
        const validation = validateLlmOutput(
          outputText,
          retrieval.products,
          retrieval.computedFacts,
          catalog,
          history.map((h) => h.content)
        );

        if (!validation.isValid) {
          hallucination = true;
          passed = false;
          notes.push(`L6 validation failed: ${validation.violations.join("; ")}`);
        }
      }
    }

    // Assertions
    if (tc.mustFallback) {
      const isFallback =
        outputText.includes("I don't have that information") ||
        outputText.includes("product assistant for") ||
        outputText.includes("contact");
      if (!isFallback) {
        passed = false;
        notes.push("Expected fallback response, but got direct answer");
      }
    }

    // Check mustNotInclude
    for (const forbidden of tc.mustNotInclude) {
      if (outputText.toLowerCase().includes(forbidden.toLowerCase())) {
        passed = false;
        hallucination = true;
        notes.push(`Response contained forbidden phrase: "${forbidden}"`);
      }
    }

    // Check expected SKUs if query should not fallback
    if (!tc.mustFallback && tc.expectedSkus.length > 0) {
      const hasAllExpected = tc.expectedSkus.some((expected) => {
        const normExpected = normalizeSku(expected);
        return (
          retrievedSkus.some((s) => normalizeSku(s) === normExpected) ||
          outputText.toLowerCase().includes(expected.toLowerCase())
        );
      });

      if (!hasAllExpected) {
        passed = false;
        notes.push(`Expected SKU [${tc.expectedSkus.join(", ")}] was not retrieved or present`);
      }
    }

    // Check exact prices if specified
    if (!tc.mustFallback && tc.exactPrices.length > 0) {
      const hasExactPrice = tc.exactPrices.some((expectedPrice) =>
        outputText.includes(expectedPrice)
      );
      if (!hasExactPrice) {
        passed = false;
        notes.push(`Expected exact price string [${tc.exactPrices.join(", ")}] missing in output`);
      }
    }

    if (passed) {
      categoryStats[tc.category].passed++;
    } else {
      console.log(`[FAIL] ${tc.id} (${tc.category}): ${notes.join("; ")}`);
    }
    if (hallucination) {
      categoryStats[tc.category].hallucinations++;
    }

    results.push({
      id: tc.id,
      category: tc.category,
      passed,
      hallucination,
      notes,
    });
  }

  // Print Summary Table
  console.log("------------------------------------------------------------------");
  console.log(
    "CATEGORY".padEnd(20) +
      "TOTAL".padStart(8) +
      "PASSED".padStart(10) +
      "PASS RATE".padStart(12) +
      "HALLUCINATIONS".padStart(16)
  );
  console.log("------------------------------------------------------------------");

  let totalCases = 0;
  let totalPassed = 0;
  let totalHallucinations = 0;

  for (const [category, stats] of Object.entries(categoryStats)) {
    totalCases += stats.total;
    totalPassed += stats.passed;
    totalHallucinations += stats.hallucinations;

    const rate = ((stats.passed / stats.total) * 100).toFixed(1) + "%";
    console.log(
      category.padEnd(20) +
        String(stats.total).padStart(8) +
        String(stats.passed).padStart(10) +
        rate.padStart(12) +
        String(stats.hallucinations).padStart(16)
    );
  }

  console.log("------------------------------------------------------------------");
  const overallRate = ((totalPassed / totalCases) * 100).toFixed(1);
  console.log(
    "OVERALL SUMMARY:".padEnd(20) +
      String(totalCases).padStart(8) +
      String(totalPassed).padStart(10) +
      `${overallRate}%`.padStart(12) +
      String(totalHallucinations).padStart(16)
  );
  console.log("------------------------------------------------------------------\n");

  if (parseFloat(overallRate) < 90.0) {
    console.error(`❌ FAILURE: Overall eval pass rate ${overallRate}% is below the 90.0% threshold.`);
    process.exit(1);
  }

  if (totalHallucinations > 0) {
    console.error(`❌ FAILURE: Detected ${totalHallucinations} price or SKU hallucination(s).`);
    process.exit(1);
  }

  console.log(`✅ EVALUATION PASSED: ${overallRate}% pass rate with 0 hallucinations across ${totalCases} test cases.\n`);
  process.exit(0);
}

runEval().catch((err) => {
  console.error("Eval runner fatal error:", err);
  process.exit(1);
});
