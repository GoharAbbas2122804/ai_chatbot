import { z } from "zod";
import { CONFIG } from "../config";
import type { ChatMessageContext } from "../retrieval/types";

/**
 * Strips invisible control characters, zero-width spaces, and collapses whitespace.
 */
export function sanitizeText(text: string): string {
  if (!text) return "";
  return text
    // Strip ASCII control characters except newline and tab
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    // Strip zero-width characters and BOM
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    // Collapse multiple spaces/tabs to single space
    .replace(/[^\S\r\n]+/g, " ")
    .trim();
}

const rawMessagePartSchema = z.object({
  type: z.string(),
  text: z.string().optional(),
});

const rawMessageSchema = z.object({
  role: z.string().optional(),
  content: z.string().optional(),
  parts: z.array(rawMessagePartSchema).optional(),
});

export const requestBodySchema = z.object({
  messages: z.array(rawMessageSchema).optional().default([]),
});

export interface SanitizedInput {
  sanitizedMessages: ChatMessageContext[];
  lastUserMessage: string;
}

export class InputValidationError extends Error {
  constructor(message: string, public readonly statusCode = 400) {
    super(message);
    this.name = "InputValidationError";
  }
}

/**
 * L1 Input Validation Layer
 * Enforces message limits, character caps, control-character sanitization,
 * and extracts pure text parts only.
 */
export function validateAndSanitizeInput(body: unknown): SanitizedInput {
  const parsed = requestBodySchema.safeParse(body);
  if (!parsed.success) {
    throw new InputValidationError("Malformed request payload. Expected { messages: [...] }");
  }

  const rawMessages = parsed.data.messages;

  // Enforce total message history cap
  if (rawMessages.length > CONFIG.L1.MAX_TOTAL_MESSAGES) {
    throw new InputValidationError(
      `Conversation exceeds maximum limit of ${CONFIG.L1.MAX_TOTAL_MESSAGES} messages`
    );
  }

  // Filter to the last active examination window
  const recentSlice = rawMessages.slice(-CONFIG.L1.LAST_MESSAGES_TO_EXAMINE);

  const sanitizedMessages: ChatMessageContext[] = [];

  for (const rawMsg of recentSlice) {
    const rawRole = (rawMsg.role || "user").toLowerCase();

    // Discard client-supplied system messages and tool parts
    if (rawRole === "system" || rawRole === "tool" || rawRole === "data") {
      continue;
    }

    // Extract text from parts or content
    let text = "";
    if (rawMsg.parts && Array.isArray(rawMsg.parts)) {
      text = rawMsg.parts
        .filter((part) => part.type === "text" && typeof part.text === "string")
        .map((part) => part.text)
        .join(" ");
    } else if (typeof rawMsg.content === "string") {
      text = rawMsg.content;
    }

    const cleaned = sanitizeText(text);
    if (!cleaned) continue;

    // Map role: treat any non-assistant message as user
    const role: "user" | "assistant" = rawRole === "assistant" ? "assistant" : "user";
    sanitizedMessages.push({ role, content: cleaned });
  }

  // Find the last user message
  const userMessages = sanitizedMessages.filter((m) => m.role === "user");
  if (userMessages.length === 0) {
    throw new InputValidationError("No valid user message found in conversation");
  }

  const lastUserMessage = userMessages[userMessages.length - 1].content;

  // Enforce max characters on the active user query
  if (lastUserMessage.length > CONFIG.L1.MAX_USER_MESSAGE_CHARS) {
    throw new InputValidationError(
      `User query exceeds maximum limit of ${CONFIG.L1.MAX_USER_MESSAGE_CHARS} characters (received ${lastUserMessage.length})`
    );
  }

  return {
    sanitizedMessages,
    lastUserMessage,
  };
}
