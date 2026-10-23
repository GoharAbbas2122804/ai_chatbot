# Architectural & Implementation Decisions

## 1. AI SDK Message Streaming Protocol
- **Prompt Reference**: Mentions `createUIMessageStream` and `createUIMessageStreamResponse` emitting `text-start`, `text-delta` chunk fields.
- **Installed Version**: `ai@4.1.45` and `@ai-sdk/react@1.1.18`.
- **Decision**: In `ai@4.1.45`, the standard API consumed by `@ai-sdk/react`'s `useChat` is `createDataStreamResponse`. To emit simulated typing deltas of ~12 characters with a ~15ms delay after full post-generation Output Validation (L6), we stream using `dataStream.write(formatDataStreamPart("text", chunk))` and send metadata parts via `dataStream.writeData(...)`. This guarantees full backward and forward compatibility with the frontend's `useChat` without breaking changes or client runtime errors.

## 2. LLM Model and AI Gateway Integration
- **Prompt Reference**: Model referenced via `env.LLM_MODEL` as an AI Gateway `"provider/model"` string.
- **Decision**: We use `@ai-sdk/openai` configured with `baseURL: env.AI_GATEWAY_BASE_URL || "https://ai-gateway.vercel.sh/v1"` (or custom gateway URL) and `apiKey: env.AI_GATEWAY_API_KEY`. It passes the `provider/model` string directly. If AI Gateway returns a 403 (e.g., restricted model on free tier) or 429 (rate limit), it retries once with `env.LLM_FALLBACK_MODEL` before failing gracefully with a 503 response.

## 3. Zod Version
- **Installed Version**: `zod@4.6.7`.
- **Decision**: All schemas use canonical Zod types (`z.object`, `z.string`, `z.number`, `z.enum`, etc.) compatible with TypeScript strict mode and zero warnings.

## 4. Single Configuration Source of Truth
- **Decision**: Every configurable threshold, timing constant, rate limit, and model parameter is consolidated strictly into `lib/config.ts`.
