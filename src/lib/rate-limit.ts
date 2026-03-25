/**
 * Sliding-window rate limiter.
 *
 * ── Architecture note ──────────────────────────────────────────────────
 * On Vercel Serverless / Edge, each invocation may land on a fresh
 * isolate, so in-memory state is best-effort only.  This is acceptable
 * as a defense-in-depth layer because:
 *
 *  1. It stops runaway loops and abusive bursts within a single isolate.
 *  2. Vercel's own DDoS protection and WAF sit in front of this.
 *  3. Clerk session validation and API-key checks already gate access.
 *
 * For hard per-user quotas (billing, abuse prevention) consider:
 *   - Vercel Rate Limiting (vercel.com/docs/security/rate-limiting)
 *   - Upstash Redis (@upstash/ratelimit — single RTT, edge-compatible)
 *   - Cloudflare WAF rate rules (if fronted by CF)
 *
 * The interface is stable, so swapping the backing store later is a
 * one-file change.
 * ────────────────────────────────────────────────────────────────────────
 */

export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window. */
  maxRequests: number;
  /** Window size in seconds. */
  windowSeconds: number;
}

export interface RateLimitResult {
  allowed: boolean;
  /** Requests remaining in the current window. */
  remaining: number;
  /** Unix timestamp (seconds) when the window resets. */
  resetAt: number;
}

/* ─── In-memory sliding-window store ────────────────────── */

interface WindowEntry {
  count: number;
  /** Epoch ms when this window expires. */
  resetAt: number;
}

const store = new Map<string, WindowEntry>();

/** Evict stale entries periodically to prevent memory growth. */
const CLEANUP_INTERVAL_MS = 60_000;
let lastCleanup = Date.now();

function cleanup(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) store.delete(key);
  }
}

/**
 * Check whether a request identified by `key` is within the rate limit.
 *
 * @param key     Unique identifier — typically `${ip}:${pathname}`
 * @param config  Max requests & window size
 */
export function rateLimit(
  key: string,
  config: RateLimitConfig,
): RateLimitResult {
  cleanup();

  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;
  const entry = store.get(key);

  // Current window still active
  if (entry && entry.resetAt > now) {
    entry.count += 1;
    return {
      allowed: entry.count <= config.maxRequests,
      remaining: Math.max(0, config.maxRequests - entry.count),
      resetAt: Math.ceil(entry.resetAt / 1000),
    };
  }

  // Start a new window
  const resetAt = now + windowMs;
  store.set(key, { count: 1, resetAt });

  return {
    allowed: true,
    remaining: config.maxRequests - 1,
    resetAt: Math.ceil(resetAt / 1000),
  };
}

/* ─── Pre-defined limits ──────────────────────────────── */

export const RATE_LIMITS = {
  /** Authenticated API routes: 120 requests / minute. */
  api: { maxRequests: 120, windowSeconds: 60 } satisfies RateLimitConfig,

  /** Public / unauthenticated routes: 30 requests / minute. */
  public: { maxRequests: 30, windowSeconds: 60 } satisfies RateLimitConfig,

  /** OAuth callbacks: 10 / minute (prevent abuse). */
  oauth: { maxRequests: 10, windowSeconds: 60 } satisfies RateLimitConfig,

  /** Write operations (POST/PUT/PATCH/DELETE): 30 / minute. */
  write: { maxRequests: 30, windowSeconds: 60 } satisfies RateLimitConfig,
} as const;
