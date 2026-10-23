import { NextResponse } from "next/server";
import crypto from "crypto";
import { createDataStreamResponse, formatDataStreamPart, type CoreMessage } from "ai";
import { CONFIG } from "@/lib/config";
import { env } from "@/lib/env";
import { getCatalog } from "@/lib/catalog/loader";
import { defaultRetriever } from "@/lib/retrieval/retriever";
import { extractSkusFromHistory } from "@/lib/retrieval/query";
import { getOrBuildSearchIndex } from "@/lib/retrieval/minisearch";
import { validateAndSanitizeInput, InputValidationError } from "@/lib/guardrails/l1-input";
import { checkRateLimit, extractClientIp, hashIp } from "@/lib/guardrails/l2-abuse";
import { screenMessageHeuristics } from "@/lib/guardrails/l3-injection";
import { checkRetrievalGate, generateCatalogFallbackMessage } from "@/lib/guardrails/l4-gate";
import { buildSystemPrompt, formatCatalogContext } from "@/lib/prompt";
import { validateLlmOutput } from "@/lib/guardrails/l6-validator";
import { generateCatalogAnswer, LlmServiceError } from "@/lib/llm/client";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * Checks whether the request Origin or Sec-Fetch-Site is permissible.
 * Stops browser hotlinking only; rate limits are the real defense.
 */
function isAllowedOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  const host = req.headers.get("host") || "";
  const secFetchSite = req.headers.get("sec-fetch-site");

  // Allow same-origin or local same-site requests
  if (secFetchSite === "same-origin" || secFetchSite === "same-site") {
    return true;
  }

  // If no origin header is provided (e.g. server-to-server or same-origin direct navigation)
  if (!origin) {
    return true;
  }

  // Check against host
  try {
    const originUrl = new URL(origin);
    if (originUrl.host === host) {
      return true;
    }
  } catch {
    // Malformed origin URL
    return false;
  }

  // Check against explicit allowed origins
  if (env.ALLOWED_EMBED_ORIGINS.length > 0) {
    return env.ALLOWED_EMBED_ORIGINS.some((allowed) => {
      try {
        const allowedHost = new URL(allowed).host;
        return origin.includes(allowedHost);
      } catch {
        return origin.includes(allowed);
      }
    });
  }

  return true;
}

/**
 * Helper to emit assistant text as an AI SDK UI message stream with typewriter deltas (~12 chars, ~15ms delay).
 */
function streamValidatedTextResponse(
  fullText: string,
  requestId: string,
  guardOutcome: "ok" | "blocked" | "fallback",
  metadata?: Record<string, unknown>
) {
  return createDataStreamResponse({
    headers: {
      "X-Request-Id": requestId,
      "X-Guard": guardOutcome,
    },
    execute: async (dataStream) => {
      if (metadata) {
        dataStream.writeData(metadata);
      }

      const chunkSize = CONFIG.STREAM.CHUNK_CHARS;
      const delayMs = CONFIG.STREAM.CHUNK_DELAY_MS;

      for (let i = 0; i < fullText.length; i += chunkSize) {
        const chunk = fullText.slice(i, i + chunkSize);
        dataStream.write(formatDataStreamPart("text", chunk));
        if (delayMs > 0 && i + chunkSize < fullText.length) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    },
  });
}

export async function POST(req: Request) {
  const startTime = Date.now();
  const requestId = `req_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
  const clientIp = extractClientIp(req);
  const ipHash = hashIp(clientIp);

  // 1. Origin Check (Anti-Hotlinking)
  if (!isAllowedOrigin(req)) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN_ORIGIN", message: "Cross-origin request not permitted" } },
      { status: 403, headers: { "X-Request-Id": requestId } }
    );
  }

  // 2. L1 Input Validation
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_JSON", message: "Malformed JSON payload" } },
      { status: 400, headers: { "X-Request-Id": requestId } }
    );
  }

  let sanitizedMessages;
  let lastUserMessage: string;

  try {
    const input = validateAndSanitizeInput(rawBody);
    sanitizedMessages = input.sanitizedMessages;
    lastUserMessage = input.lastUserMessage;
  } catch (err) {
    if (err instanceof InputValidationError) {
      return NextResponse.json(
        { error: { code: "INVALID_INPUT", message: err.message } },
        { status: err.statusCode, headers: { "X-Request-Id": requestId } }
      );
    }
    return NextResponse.json(
      { error: { code: "INVALID_INPUT", message: "Invalid message payload" } },
      { status: 400, headers: { "X-Request-Id": requestId } }
    );
  }

  // 3. L2 Abuse Control (Rate Limits)
  const rateLimitResult = await checkRateLimit(req);
  if (!rateLimitResult.success) {
    const retryAfter = rateLimitResult.retryAfterSeconds || 60;
    return NextResponse.json(
      {
        error: {
          code: "RATE_LIMITED",
          message: `Too many inquiries. Please wait ${retryAfter} seconds before submitting your next question.`,
        },
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "X-Request-Id": requestId,
        },
      }
    );
  }

  // 4. L3 Heuristic Injection & Off-Topic Screen
  const heuristic = screenMessageHeuristics(lastUserMessage);
  if (heuristic.action === "blocked" || heuristic.action === "static_reply") {
    const replyText = heuristic.staticReply || generateCatalogFallbackMessage();
    const guardOutcome = heuristic.action === "blocked" ? "blocked" : "fallback";

    // Structured Audit Log
    console.log(
      JSON.stringify({
        requestId,
        ipHash,
        guardOutcome,
        matchedPattern: heuristic.matchedPattern,
        latencyMs: Date.now() - startTime,
        ...(env.LOG_QUERIES ? { query: lastUserMessage } : {}),
      })
    );

    return streamValidatedTextResponse(replyText, requestId, guardOutcome, {
      guard: guardOutcome,
      reason: heuristic.matchedPattern,
    });
  }

  // 5. Load Master Catalog
  let catalog;
  try {
    catalog = await getCatalog(false);
  } catch (err: unknown) {
    console.error(`[Chat API] Catalog retrieval failure for ${requestId}:`, err);
    return NextResponse.json(
      { error: { code: "CATALOG_UNAVAILABLE", message: "Product catalog is temporarily unavailable." } },
      { status: 503, headers: { "X-Request-Id": requestId } }
    );
  }

  // 6. Retrieval
  const retrieval = await defaultRetriever.retrieve(lastUserMessage, sanitizedMessages, catalog);

  // 7. L4 Retrieval Gate
  const gateCheck = checkRetrievalGate(retrieval);
  if (!gateCheck.shouldProceedToLlm) {
    const fallbackText = gateCheck.fallbackMessage || generateCatalogFallbackMessage();

    console.log(
      JSON.stringify({
        requestId,
        ipHash,
        guardOutcome: "fallback",
        confidence: retrieval.confidence,
        topScore: retrieval.topScore,
        latencyMs: Date.now() - startTime,
        catalogVersion: catalog.version,
        ...(env.LOG_QUERIES ? { query: lastUserMessage } : {}),
      })
    );

    return streamValidatedTextResponse(fallbackText, requestId, "fallback", {
      guard: "fallback",
      confidence: retrieval.confidence,
      reason: gateCheck.reason,
    });
  }

  // 8. L5 Prompt Construction & LLM Generation
  const baseSystemPrompt = buildSystemPrompt();
  const catalogXml = formatCatalogContext(retrieval.products, retrieval.computedFacts);
  const fullSystemPrompt = `${baseSystemPrompt}\n\n${catalogXml}`;

  // Pass last 4 turns of history as text only
  const historySlice = sanitizedMessages.slice(-CONFIG.L5.HISTORY_TURNS_FOR_PROMPT * 2);
  const coreMessages: CoreMessage[] = historySlice.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const { normalizedSkuMap } = getOrBuildSearchIndex(catalog);
  const historySkus = extractSkusFromHistory(sanitizedMessages, normalizedSkuMap, 2);

  let generatedAnswer = "";
  let finalModel = env.LLM_MODEL;
  let validationStatus: "pass" | "retry" | "fail" = "pass";
  let offendingTokens: string[] = [];
  let tokenUsage: { promptTokens?: number; completionTokens?: number } | undefined;

  try {
    // Initial generation
    const genResult = await generateCatalogAnswer({
      system: fullSystemPrompt,
      messages: coreMessages,
    });

    generatedAnswer = genResult.text;
    finalModel = genResult.model;
    tokenUsage = { promptTokens: genResult.promptTokens, completionTokens: genResult.completionTokens };

    // 9. L6 Output Validation
    const validation1 = validateLlmOutput(
      generatedAnswer,
      retrieval.products,
      retrieval.computedFacts,
      catalog,
      historySkus
    );

    if (!validation1.isValid) {
      validationStatus = "retry";
      offendingTokens = validation1.offendingTokens;
      console.warn(
        `[L6 Output Validator] Answer failed validation for ${requestId} (violations: ${validation1.violations.join(
          "; "
        )}). Triggering one corrective retry.`
      );

      // ONE corrective retry with explicit feedback
      const retryMessages: CoreMessage[] = [
        ...coreMessages,
        { role: "assistant", content: generatedAnswer },
        { role: "user", content: validation1.correctivePrompt || "Please correct the output according to the catalog." },
      ];

      const retryResult = await generateCatalogAnswer({
        system: fullSystemPrompt,
        messages: retryMessages,
      });

      generatedAnswer = retryResult.text;
      finalModel = retryResult.model;

      const validation2 = validateLlmOutput(
        generatedAnswer,
        retrieval.products,
        retrieval.computedFacts,
        catalog,
        historySkus
      );

      if (!validation2.isValid) {
        validationStatus = "fail";
        offendingTokens = validation2.offendingTokens;
        console.warn(
          `[L6 Output Validator] Corrective retry also failed for ${requestId}. Falling back to safe catalog fallback message.`
        );
        generatedAnswer = generateCatalogFallbackMessage();
      } else {
        validationStatus = "pass";
      }
    }
  } catch (llmErr) {
    if (llmErr instanceof LlmServiceError) {
      return NextResponse.json(
        { error: { code: "LLM_SERVICE_ERROR", message: llmErr.message } },
        { status: llmErr.statusCode, headers: { "X-Request-Id": requestId } }
      );
    }
    console.error(`[Chat API] Generation error for ${requestId}:`, llmErr);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to generate catalog answer." } },
      { status: 503, headers: { "X-Request-Id": requestId } }
    );
  }

  const latencyMs = Date.now() - startTime;

  // 10. Structured Audit Log (Observability)
  console.log(
    JSON.stringify({
      requestId,
      ipHash,
      guardOutcome: "ok",
      confidence: retrieval.confidence,
      retrievedSkus: retrieval.resolvedSkus,
      topScore: retrieval.topScore,
      model: finalModel,
      latencyMs,
      tokenUsage,
      validationResult: validationStatus,
      offendingTokens: offendingTokens.length > 0 ? offendingTokens : undefined,
      catalogVersion: catalog.version,
      ...(env.LOG_QUERIES ? { query: lastUserMessage } : {}),
    })
  );

  return streamValidatedTextResponse(generatedAnswer, requestId, "ok", {
    status: "verified",
    confidence: retrieval.confidence,
    retrievedSkus: retrieval.resolvedSkus,
    model: finalModel,
  });
}
