/**
 * D1-backed rate limiter.
 *
 * Uses a single atomic INSERT … ON CONFLICT DO UPDATE RETURNING to
 * check-and-increment in one round-trip.  The `rate_limits` table
 * stores (key, window, hits) where `window` is the Unix minute
 * (epoch ÷ 60).
 *
 * Stale rows accumulate harmlessly — run periodic cleanup if needed:
 *   DELETE FROM rate_limits WHERE window < ?
 */

import { d1Query } from "@/lib/cloudflare";

export interface RateLimitResult {
  allowed: boolean;
  hits: number;
  limit: number;
  /** Seconds until the current window resets. */
  retryAfter: number;
}

/**
 * Check (and count) a request against the rate limit.
 *
 * @param key   Identifier — e.g. "user:abc123" or "ip:1.2.3.4"
 * @param limit Max requests allowed per 60-second window
 */
export async function checkRateLimit(
  key: string,
  limit: number,
): Promise<RateLimitResult> {
  const now = Math.floor(Date.now() / 1000);
  const window = Math.floor(now / 60);
  const retryAfter = 60 - (now % 60);

  const result = await d1Query<{ hits: number }>(
    `INSERT INTO rate_limits (key, window, hits)
     VALUES (?, ?, 1)
     ON CONFLICT (key, window) DO UPDATE SET hits = hits + 1
     RETURNING hits`,
    [key, window],
  );

  const hits = result.results[0]?.hits ?? 1;

  return {
    allowed: hits <= limit,
    hits,
    limit,
    retryAfter,
  };
}
