/**
 * Central Configuration & Tunables
 * All thresholds, limits, and timing constants for the catalog chatbot backend.
 */

export const CONFIG = {
  // Catalog Loading & Caching
  CATALOG: {
    FETCH_TIMEOUT_MS: 8_000,
    DEFAULT_TTL_SECONDS: 300,
    RETRY_INTERVAL_MS: 60_000,
    MAX_INVALID_ROW_RATIO: 0.2, // > 20% invalid rows rejects load
  },

  // MiniSearch Retrieval
  RETRIEVAL: {
    TOP_K: 5,
    BOOST_SKU: 5,
    BOOST_NAME: 3,
    FUZZY: 0.2,
    PREFIX: true,
    SCORE_THRESHOLDS: {
      HIGH: 8.0,
      LOW: 3.5,
    },
  },

  // Guardrail L1: Input Validation
  L1: {
    MAX_USER_MESSAGE_CHARS: 500,
    MAX_TOTAL_MESSAGES: 20,
    LAST_MESSAGES_TO_EXAMINE: 6,
  },

  // Guardrail L2: Abuse & Rate Limits
  L2: {
    RATE_LIMIT_PER_MIN: 10,
    RATE_LIMIT_PER_DAY: 100,
    GLOBAL_DAILY_CAP: 5_000,
  },

  // Guardrail L3: Heuristic Screening
  L3: {
    MAX_ENCODED_TOKEN_LENGTH: 120,
  },

  // Guardrail L5: LLM Generation Parameters
  L5: {
    TEMPERATURE: 0,
    MAX_OUTPUT_TOKENS: 2048,
    TIMEOUT_MS: 20_000,
    HISTORY_TURNS_FOR_PROMPT: 4,
  },

  // Output Streaming
  STREAM: {
    CHUNK_CHARS: 12,
    CHUNK_DELAY_MS: 15,
  },

  // Security & Admin
  AUTH: {
    ADMIN_TOKEN_MIN_LENGTH: 24,
  },
} as const;
