# Architectural & Implementation Decisions

## 1. AI SDK Message Streaming Protocol
- **Prompt Reference**: Mentions `createUIMessageStream` and `createUIMessageStreamResponse` emitting `text-start`, `text-delta` chunk fields.
- **Installed Version**: `ai@4.1.45` and `@ai-sdk/react@1.1.18`.
- **Decision**: In `ai@4.1.45`, the standard API consumed by `@ai-sdk/react`'s `useChat` is `createDataStreamResponse`. To emit simulated typing deltas of ~12 characters with a ~15ms delay after full post-generation Output Validation (L6), we stream using `dataStream.write(formatDataStreamPart("text", chunk))` and send metadata parts via `dataStream.writeData(...)`. This guarantees full backward and forward compatibility with the frontend's `useChat` without breaking changes or client runtime errors.

## 2. LLM Model and AI Gateway Integration
- **Prompt Reference**: Model referenced via `env.LLM_MODEL` as an AI Gateway `"provider/model"` string.
- **Decision**: We use `@ai-sdk/openai` configured with `baseURL: env.AI_GATEWAY_BASE_URL || "https://ai-gateway.vercel.sh/v1"` and `apiKey: env.AI_GATEWAY_API_KEY`. It passes the `provider/model` string directly. If AI Gateway returns a 403 (restricted model on free tier) or 429 (rate limit), it retries once with `env.LLM_FALLBACK_MODEL` before failing gracefully with a 503 response.

## 3. Support for Reasoning Models (`nvidia/nemotron-3.5-lightning-free`)
- **Discovery**: Nemotron models emit internal reasoning/thinking tokens that count against the completion token quota. With default `maxTokens: 400`, the thinking tokens exhausted the limit before content generation could occur, producing empty strings.
- **Decision**: Increased `MAX_OUTPUT_TOKENS` to `2048` in `lib/config.ts`. This affords ~300-800 tokens for internal reasoning while leaving 1200+ tokens for full catalog answers, sustaining rapid 2-4 second response times.

## 4. Single Configuration Source of Truth
- **Decision**: Every configurable threshold, timing constant, rate limit, and model parameter is consolidated strictly into `lib/config.ts`.

## 5. Animation & Motion Ownership
- **Decision**: GSAP 3 owns page-level scroll motion, parallax, SplitText masked reveals, pinned storytelling scrubbing, and count-up numbers. Lenis smooth scrolling is synchronized into GSAP's ticker via `gsap.ticker.add((time) => lenis.raf(time * 1000))` with `autoRaf: false`. Motion (Framer Motion) exclusively owns localized UI micro-interactions (spring chat widget launcher and message transitions).
- **Safety**: `html.js` class is injected in `<head>` to prevent SSR flash of unstyled/hidden content. A 3-second safety net timer falls back to `html.motion-failed` in case of script blocking.

## 6. Minimal, Clean Chat Widget Interface
- **Decision**: Stripped pseudo-tech jargon (such as "OPERATOR", "LAYER 03", redundant technical badges) in favor of a clean, minimalist chat interface with subtle SKU badge highlighting, clear reset action, discrete copy button with checkmark feedback, 3-dot wave loading indicator, and responsive drawer on mobile.
