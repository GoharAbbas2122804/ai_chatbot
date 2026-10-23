import crypto from "crypto";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { CONFIG } from "../config";
import { env } from "../env";

export interface RateLimitCheckResult {
  success: boolean;
  limit?: number;
  remaining?: number;
  reset?: number; // ms timestamp
  retryAfterSeconds?: number;
  reason?: "PER_MINUTE_LIMIT" | "PER_DAY_LIMIT" | "GLOBAL_DAILY_CAP" | "UPSTASH_CONFIG_MISSING";
}

/**
 * Anonymizes client IP address using HMAC-SHA256 with secret salt.
 * Produces a consistent, non-reversible token for audit logs.
 */
export function hashIp(ip: string): string {
  return crypto
    .createHmac("sha256", env.IP_HASH_SALT)
    .update(ip)
    .digest("hex")
    .substring(0, 16);
}

/**
 * Extracts client IP from request headers (first entry of x-forwarded-for).
 */
export function extractClientIp(req: Request): string {
  const xForwardedFor = req.headers.get("x-forwarded-for");
  if (xForwardedFor) {
    const firstIp = xForwardedFor.split(",")[0].trim();
    if (firstIp) return firstIp;
  }
  return req.headers.get("x-real-ip") || "127.0.0.1";
}

// In-memory sliding-window limiter for development / test fallback
interface InMemoryWindow {
  timestamps: number[];
}
const devMinuteMap = new Map<string, InMemoryWindow>();
const devDayMap = new Map<string, InMemoryWindow>();
let devGlobalDayCount = 0;
let devGlobalDayReset = Date.now() + 86400000;

function checkInMemoryLimit(key: string, maxHits: number, windowMs: number, map: Map<string, InMemoryWindow>): { success: boolean; remaining: number; reset: number } {
  const now = Date.now();
  let record = map.get(key);
  if (!record) {
    record = { timestamps: [] };
    map.set(key, record);
  }

  // Prune timestamps outside window
  record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

  if (record.timestamps.length >= maxHits) {
    const oldest = record.timestamps[0];
    const reset = oldest + windowMs;
    return { success: false, remaining: 0, reset };
  }

  record.timestamps.push(now);
  return { success: true, remaining: maxHits - record.timestamps.length, reset: now + windowMs };
}

// Upstash Ratelimit instances (created OUTSIDE handler)
let minuteLimiter: Ratelimit | null = null;
let dayLimiter: Ratelimit | null = null;
let globalDailyLimiter: Ratelimit | null = null;

if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
  const redis = new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  });

  minuteLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(CONFIG.L2.RATE_LIMIT_PER_MIN, "60 s"),
    prefix: "rl:min",
  });

  dayLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(CONFIG.L2.RATE_LIMIT_PER_DAY, "86400 s"),
    prefix: "rl:day",
  });

  globalDailyLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(CONFIG.L2.GLOBAL_DAILY_CAP, "86400 s"),
    prefix: "rl:global",
  });
}

/**
 * L2 Abuse Control Layer
 * Checks per-minute, per-day, and global daily rate limits.
 */
export async function checkRateLimit(req: Request): Promise<RateLimitCheckResult> {
  const clientIp = extractClientIp(req);
  const ipKey = hashIp(clientIp);

  // If Upstash is not configured, fall back to in-memory sliding window limiter
  if (!minuteLimiter || !dayLimiter || !globalDailyLimiter) {
    // Development / Local in-memory fallback
    console.warn(
      "[L2 Abuse Control] Notice: Upstash Redis is not configured. Active with in-memory rate limiter fallback."
    );

    // Global daily cap check
    const now = Date.now();
    if (now > devGlobalDayReset) {
      devGlobalDayCount = 0;
      devGlobalDayReset = now + 86400000;
    }
    if (++devGlobalDayCount > CONFIG.L2.GLOBAL_DAILY_CAP) {
      return {
        success: false,
        reason: "GLOBAL_DAILY_CAP",
        retryAfterSeconds: Math.ceil((devGlobalDayReset - now) / 1000),
      };
    }

    // Per-minute check (10/min)
    const minResult = checkInMemoryLimit(ipKey, CONFIG.L2.RATE_LIMIT_PER_MIN, 60_000, devMinuteMap);
    if (!minResult.success) {
      return {
        success: false,
        limit: CONFIG.L2.RATE_LIMIT_PER_MIN,
        remaining: 0,
        reset: minResult.reset,
        retryAfterSeconds: Math.ceil((minResult.reset - now) / 1000),
        reason: "PER_MINUTE_LIMIT",
      };
    }

    // Per-day check (100/day)
    const dayResult = checkInMemoryLimit(ipKey, CONFIG.L2.RATE_LIMIT_PER_DAY, 86_400_000, devDayMap);
    if (!dayResult.success) {
      return {
        success: false,
        limit: CONFIG.L2.RATE_LIMIT_PER_DAY,
        remaining: 0,
        reset: dayResult.reset,
        retryAfterSeconds: Math.ceil((dayResult.reset - now) / 1000),
        reason: "PER_DAY_LIMIT",
      };
    }

    return {
      success: true,
      remaining: minResult.remaining,
      reset: minResult.reset,
    };
  }

  // Upstash Distributed Redis Limiting
  try {
    // 1. Global Daily Cap check
    const globalRes = await globalDailyLimiter.limit("global");
    if (!globalRes.success) {
      const retryAfter = Math.max(1, Math.ceil((globalRes.reset - Date.now()) / 1000));
      return {
        success: false,
        limit: CONFIG.L2.GLOBAL_DAILY_CAP,
        remaining: 0,
        reset: globalRes.reset,
        retryAfterSeconds: retryAfter,
        reason: "GLOBAL_DAILY_CAP",
      };
    }

    // 2. Per-Minute IP Limit
    const minRes = await minuteLimiter.limit(ipKey);
    if (!minRes.success) {
      const retryAfter = Math.max(1, Math.ceil((minRes.reset - Date.now()) / 1000));
      return {
        success: false,
        limit: CONFIG.L2.RATE_LIMIT_PER_MIN,
        remaining: 0,
        reset: minRes.reset,
        retryAfterSeconds: retryAfter,
        reason: "PER_MINUTE_LIMIT",
      };
    }

    // 3. Per-Day IP Limit
    const dayRes = await dayLimiter.limit(ipKey);
    if (!dayRes.success) {
      const retryAfter = Math.max(1, Math.ceil((dayRes.reset - Date.now()) / 1000));
      return {
        success: false,
        limit: CONFIG.L2.RATE_LIMIT_PER_DAY,
        remaining: 0,
        reset: dayRes.reset,
        retryAfterSeconds: retryAfter,
        reason: "PER_DAY_LIMIT",
      };
    }

    return {
      success: true,
      limit: minRes.limit,
      remaining: minRes.remaining,
      reset: minRes.reset,
    };
  } catch (error) {
    console.error("[L2 Abuse Control] Error connecting to Upstash Redis:", error);
    if (env.NODE_ENV === "production") {
      // Fail closed in production to prevent unbounded spend
      return {
        success: false,
        reason: "UPSTASH_CONFIG_MISSING",
        retryAfterSeconds: 60,
      };
    }
    // Allow through with warning in development
    return { success: true };
  }
}
