/**
 * In-memory sliding-window rate limiter.
 *
 * Uses a fixed-window counter with sub-second precision.
 * Suitable for single-instance Vercel deployments. For multi-region,
 * swap this with an Upstash Redis or Cloudflare KV–backed implementation.
 *
 * Usage in middleware:
 * ```ts
 * import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
 * const result = rateLimit(identifier, RATE_LIMITS.api);
 * if (!result.allowed) return new NextResponse("Too Many Requests", { status: 429 });
 * ```
 */

export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window. */
  maxRequests: number;
  /** Window size in seconds. */
  windowSeconds: number;
}

interface WindowEntry {
  count: number;
  /** Timestamp (ms) when this window resets. */
  resetAt: number;
}

/* ─── In-memory store ─────────────────────────────────── */

const store = new Map<string, WindowEntry>();

/** Evict stale entries every 60 seconds to prevent memory leaks. */
const CLEANUP_INTERVAL_MS = 60_000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) store.delete(key);
  }
}

/* ─── Rate limit check ────────────────────────────────── */

export interface RateLimitResult {
  allowed: boolean;
  /** Requests remaining in the current window. */
  remaining: number;
  /** Unix timestamp (seconds) when the window resets. */
  resetAt: number;
}

/**
 * Check whether a request from `identifier` is within the rate limit.
 *
 * @param identifier  Unique key — typically `userId` or IP address
 * @param config      Max requests & window size
 */
export function rateLimit(
  identifier: string,
  config: RateLimitConfig,
): RateLimitResult {
  cleanup();

  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;
  const entry = store.get(identifier);

  // Current window still active
  if (entry && entry.resetAt > now) {
    entry.count += 1;
    const allowed = entry.count <= config.maxRequests;
    return {
      allowed,
      remaining: Math.max(0, config.maxRequests - entry.count),
      resetAt: Math.ceil(entry.resetAt / 1000),
    };
  }

  // Start a new window
  const resetAt = now + windowMs;
  store.set(identifier, { count: 1, resetAt });

  return {
    allowed: true,
    remaining: config.maxRequests - 1,
    resetAt: Math.ceil(resetAt / 1000),
  };
}

/* ─── Pre-defined limits ──────────────────────────────── */

export const RATE_LIMITS = {
  /** Authenticated API routes: 120 requests per minute. */
  api: { maxRequests: 120, windowSeconds: 60 } satisfies RateLimitConfig,

  /** Public / unauthenticated routes: 30 requests per minute. */
  public: { maxRequests: 30, windowSeconds: 60 } satisfies RateLimitConfig,

  /** OAuth callbacks: 10 per minute (prevent abuse). */
  oauth: { maxRequests: 10, windowSeconds: 60 } satisfies RateLimitConfig,

  /** Write operations (POST/PUT/PATCH/DELETE): 30 per minute. */
  write: { maxRequests: 30, windowSeconds: 60 } satisfies RateLimitConfig,
} as const;
