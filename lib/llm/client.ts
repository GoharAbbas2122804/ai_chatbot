import { generateText, type CoreMessage } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { CONFIG } from "../config";
import { env } from "../env";

export class LlmServiceError extends Error {
  constructor(public readonly statusCode: number, message: string, public readonly originalError?: unknown) {
    super(message);
    this.name = "LlmServiceError";
  }
}

const gatewayClient = createOpenAI({
  baseURL: env.AI_GATEWAY_BASE_URL || "https://ai-gateway.vercel.sh/v1",
  apiKey: env.AI_GATEWAY_API_KEY,
});

/**
 * Checks if an error corresponds to HTTP 403 (restricted model) or 429 (rate/quota limit).
 */
function isRestrictedOrRateLimited(error: unknown): boolean {
  if (!error) return false;
  const msg = String(error).toLowerCase();
  const status = (error as { status?: number; statusCode?: number })?.status || (error as { statusCode?: number })?.statusCode;

  return (
    status === 403 ||
    status === 429 ||
    msg.includes("403") ||
    msg.includes("429") ||
    msg.includes("rate limit") ||
    msg.includes("quota") ||
    msg.includes("restricted") ||
    msg.includes("unsupported model")
  );
}

/**
 * Checks if an error corresponds to authentication or payment issues (401/402).
 */
function isAuthOrBillingError(error: unknown): boolean {
  if (!error) return false;
  const msg = String(error).toLowerCase();
  const status = (error as { status?: number; statusCode?: number })?.status || (error as { statusCode?: number })?.statusCode;

  return (
    status === 401 ||
    status === 402 ||
    msg.includes("401") ||
    msg.includes("402") ||
    msg.includes("unauthorized") ||
    msg.includes("billing")
  );
}

export interface GenerateOptions {
  system: string;
  messages: CoreMessage[];
  modelOverride?: string;
}

export interface GenerateResult {
  text: string;
  model: string;
  promptTokens?: number;
  completionTokens?: number;
}

/**
 * Executes non-streaming text generation via AI Gateway with automatic fallback model failover.
 */
export async function generateCatalogAnswer(options: GenerateOptions): Promise<GenerateResult> {
  const primaryModelName = options.modelOverride || env.LLM_MODEL;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.L5.TIMEOUT_MS);

    try {
      const response = await generateText({
        model: gatewayClient(primaryModelName),
        system: options.system,
        messages: options.messages,
        temperature: CONFIG.L5.TEMPERATURE,
        maxTokens: CONFIG.L5.MAX_OUTPUT_TOKENS,
        abortSignal: controller.signal,
      });

      return {
        text: response.text,
        model: primaryModelName,
        promptTokens: response.usage?.promptTokens,
        completionTokens: response.usage?.completionTokens,
      };
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error: unknown) {
    // 1. Critical Auth / Billing issue: Log loudly and return 503
    if (isAuthOrBillingError(error)) {
      console.error(
        "[AI Gateway] CRITICAL AUTHENTICATION / BILLING FAILURE: Check AI_GATEWAY_API_KEY and billing status. Do NOT expose this to client."
      );
      throw new LlmServiceError(503, "Catalog AI service is temporarily unavailable. Please contact support.", error);
    }

    // 2. Restricted model or rate limit: Try fallback model if available
    if (isRestrictedOrRateLimited(error) && env.LLM_FALLBACK_MODEL && env.LLM_FALLBACK_MODEL !== primaryModelName) {
      console.warn(
        `[AI Gateway] Warning: Primary model "${primaryModelName}" returned rate limit or restriction. Failing over to fallback model: "${env.LLM_FALLBACK_MODEL}".`
      );

      try {
        const fallbackController = new AbortController();
        const fallbackTimeoutId = setTimeout(() => fallbackController.abort(), CONFIG.L5.TIMEOUT_MS);

        try {
          const fallbackResponse = await generateText({
            model: gatewayClient(env.LLM_FALLBACK_MODEL),
            system: options.system,
            messages: options.messages,
            temperature: CONFIG.L5.TEMPERATURE,
            maxTokens: CONFIG.L5.MAX_OUTPUT_TOKENS,
            abortSignal: fallbackController.signal,
          });

          return {
            text: fallbackResponse.text,
            model: env.LLM_FALLBACK_MODEL,
            promptTokens: fallbackResponse.usage?.promptTokens,
            completionTokens: fallbackResponse.usage?.completionTokens,
          };
        } finally {
          clearTimeout(fallbackTimeoutId);
        }
      } catch (fallbackError: unknown) {
        console.error(
          `[AI Gateway] Fallback model "${env.LLM_FALLBACK_MODEL}" also failed:`,
          fallbackError
        );
        throw new LlmServiceError(503, "Catalog AI service is currently at maximum capacity. Please retry shortly.", fallbackError);
      }
    }

    // Generic error handling
    if (error instanceof Error && error.name === "AbortError") {
      throw new LlmServiceError(504, `LLM inference timed out after ${CONFIG.L5.TIMEOUT_MS}ms`, error);
    }

    throw new LlmServiceError(503, "Unable to complete catalog inference. Please try again.", error);
  }
}
