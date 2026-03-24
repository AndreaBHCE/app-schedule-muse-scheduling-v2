import crypto from "crypto";
import { d1Query } from "@/lib/cloudflare";
import { AuthError } from "@/lib/auth";

/**
 * All valid scopes that can be assigned to an API key.
 */
export const VALID_SCOPES = [
  "meetings:read",
  "meetings:write",
  "contacts:read",
  "contacts:write",
  "bookings:read",
  "bookings:write",
  "events:read",
  "analytics:read",
] as const;

export type ApiScope = (typeof VALID_SCOPES)[number];

interface ApiKeyRow {
  id: string;
  user_id: string;
  name: string;
  key_hash: string;
  scopes: string;
  expires_at: string | null;
}

export interface ApiKeyAuth {
  userId: string;
  scopes: ApiScope[];
}

/**
 * Extract and validate an API key from the request.
 * Checks `Authorization: Bearer smuse_...` then `x-api-key: smuse_...`.
 * Returns null if no API key is present (not an error — Clerk may handle auth instead).
 * Throws AuthError if a key IS present but invalid/expired.
 */
export async function validateApiKey(request: Request): Promise<ApiKeyAuth | null> {
  const rawKey = extractKey(request);
  if (!rawKey) return null;

  // Hash the raw key to match against stored hash
  const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");

  const result = await d1Query<ApiKeyRow>(
    `SELECT id, user_id, scopes, expires_at FROM api_keys WHERE key_hash = ?`,
    [keyHash],
  );

  if (!result.results.length) {
    throw new AuthError("Invalid API key", 401);
  }

  const row = result.results[0];

  // Check expiration
  if (row.expires_at && new Date(row.expires_at) < new Date()) {
    throw new AuthError("API key expired", 401);
  }

  // Update last_used_at (fire-and-forget — don't block the response)
  d1Query(
    `UPDATE api_keys SET last_used_at = datetime('now') WHERE id = ?`,
    [row.id],
  ).catch((err) => console.error("Failed to update api_key last_used_at:", err));

  const scopes = JSON.parse(row.scopes || "[]") as ApiScope[];

  return { userId: row.user_id, scopes };
}

/**
 * Check that the given scopes include the required scope.
 * Throws 403 if not.
 */
export function requireScope(scopes: ApiScope[] | null, required: ApiScope): void {
  // null scopes = Clerk session auth = full access
  if (scopes === null) return;

  if (!scopes.includes(required)) {
    throw new AuthError(`API key missing required scope: ${required}`, 403);
  }
}

/**
 * Extract raw API key from request headers.
 * Supports `Authorization: Bearer smuse_...` and `x-api-key: smuse_...`.
 */
function extractKey(request: Request): string | null {
  // Try Authorization header
  const authHeader = request.headers.get("authorization");
  if (authHeader) {
    const match = authHeader.match(/^Bearer\s+(smuse_.+)$/i);
    if (match) return match[1];
  }

  // Try x-api-key header
  const apiKeyHeader = request.headers.get("x-api-key");
  if (apiKeyHeader?.startsWith("smuse_")) return apiKeyHeader;

  return null;
}
