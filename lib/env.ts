import { z } from "zod";
import { CONFIG } from "./config";

const envSchema = z.object({
  AI_GATEWAY_API_KEY: z.string().min(1, "AI_GATEWAY_API_KEY is required"),
  AI_GATEWAY_BASE_URL: z.string().url().optional().default("https://ai-gateway.vercel.sh/v1"),
  LLM_MODEL: z
    .string()
    .min(1, "LLM_MODEL must be provided as a 'provider/model' string"),
  LLM_FALLBACK_MODEL: z.string().optional(),
  CATALOG_CSV_URL: z.string().min(1, "CATALOG_CSV_URL is required"),
  CATALOG_TTL_SECONDS: z.coerce
    .number()
    .int()
    .positive()
    .default(CONFIG.CATALOG.DEFAULT_TTL_SECONDS),
  ADMIN_TOKEN: z
    .string()
    .min(
      CONFIG.AUTH.ADMIN_TOKEN_MIN_LENGTH,
      `ADMIN_TOKEN must be at least ${CONFIG.AUTH.ADMIN_TOKEN_MIN_LENGTH} characters`
    ),
  ALLOWED_EMBED_ORIGINS: z
    .string()
    .default("")
    .transform((val) =>
      val
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean)
    ),
  COMPANY_NAME: z.string().min(1, "COMPANY_NAME is required"),
  CONTACT_EMAIL: z.string().email("CONTACT_EMAIL must be a valid email"),
  CONTACT_URL: z.string().url().optional().or(z.literal("")),
  UPSTASH_REDIS_REST_URL: z.string().url().optional().or(z.literal("")),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional().or(z.literal("")),
  IP_HASH_SALT: z
    .string()
    .min(16, "IP_HASH_SALT must be at least 16 characters for cryptographic salting"),
  LOG_QUERIES: z
    .string()
    .default("false")
    .transform((val) => val === "true" || val === "1"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

export type Env = z.infer<typeof envSchema>;

function parseEnv(): Env {
  // Allow skipping strict validation in build/test environments if specified,
  // but ensure clear messages when missing
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const errorDetails = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");

    const message = `\n========================================\n❌ CRITICAL ENVIRONMENT CONFIGURATION ERROR:\n${errorDetails}\n========================================\n`;

    // In unit testing, allow fallback defaults if running offline unit tests
    if (process.env.NODE_ENV === "test") {
      const mockEnv: Record<string, string> = {
        AI_GATEWAY_API_KEY: "test_gateway_key",
        LLM_MODEL: "openai/gpt-4o-mini",
        CATALOG_CSV_URL: "file://tests/fixtures/catalog.csv",
        ADMIN_TOKEN: "test_admin_token_min_24_chars_length_12345",
        COMPANY_NAME: "INDEX Test Systems",
        CONTACT_EMAIL: "support@example.com",
        IP_HASH_SALT: "test_salt_at_least_16_chars_long",
      };
      return envSchema.parse({ ...mockEnv, ...process.env });
    }

    throw new Error(message);
  }

  // Production check: If Upstash Redis env is missing, warn and fall back to memory limiter
  if (parsed.data.NODE_ENV === "production") {
    if (!parsed.data.UPSTASH_REDIS_REST_URL || !parsed.data.UPSTASH_REDIS_REST_TOKEN) {
      console.warn(
        "\n⚠️ [L2 Abuse Control] Notice: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are not configured. In-memory rate limiting fallback will be active.\n"
      );
    }
  }

  return parsed.data;
}

export const env = parseEnv();
