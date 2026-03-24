/**
 * Cloudflare D1 + KV REST API helpers.
 *
 * All calls go through the Cloudflare REST API — no Workers involved.
 * These run server-side only (Next.js API routes / Server Components).
 */

/**
 * Read an env var or throw a clear startup error.
 */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
      `Set it in .env.local (dev) or your deployment environment.`,
    );
  }
  return value;
}

const ACCOUNT_ID = requireEnv("CLOUDFLARE_ACCOUNT_ID");
const D1_DB_ID   = requireEnv("CLOUDFLARE_D1_DATABASE_ID");
const KV_NS_ID   = requireEnv("CLOUDFLARE_KV_NAMESPACE_ID");
const API_TOKEN  = requireEnv("CLOUDFLARE_API_TOKEN");

const CF_BASE = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}`;

const headers = {
  Authorization: `Bearer ${API_TOKEN}`,
  "Content-Type": "application/json",
};

/* ─────────────────────────── D1 ─────────────────────────── */

export interface D1Result<T = Record<string, unknown>> {
  results: T[];
  success: boolean;
  meta: {
    changed_db: boolean;
    changes: number;
    duration: number;
    last_row_id: number;
    rows_read: number;
    rows_written: number;
    size_after: number;
  };
}

/**
 * Run a single SQL statement against the D1 database.
 *
 * @param sql   SQL string (use ? for params)
 * @param params  Bind values
 * @returns The first result set
 */
export async function d1Query<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): Promise<D1Result<T>> {
  const res = await fetch(`${CF_BASE}/d1/database/${D1_DB_ID}/query`, {
    method: "POST",
    headers,
    body: JSON.stringify({ sql, params }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`D1 query failed (${res.status}): ${text}`);
  }

  const json = await res.json();

  if (!json.success) {
    throw new Error(`D1 query error: ${JSON.stringify(json.errors)}`);
  }

  // The REST API returns an array of result sets; we want the first one.
  return json.result[0] as D1Result<T>;
}

/**
 * Run multiple SQL statements in a single atomic batch request.
 */
export async function d1Batch(
  statements: { sql: string; params?: unknown[] }[],
): Promise<D1Result[]> {
  const res = await fetch(`${CF_BASE}/d1/database/${D1_DB_ID}/query`, {
    method: "POST",
    headers,
    body: JSON.stringify(statements.map(stmt => ({ sql: stmt.sql, params: stmt.params ?? [] }))),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`D1 batch query failed (${res.status}): ${text}`);
  }

  const json = await res.json();

  if (!json.success) {
    throw new Error(`D1 batch query error: ${JSON.stringify(json.errors)}`);
  }

  // The batch API returns an array of result sets
  return json.result as D1Result[];
}

/* ─────────────────────────── KV ─────────────────────────── */

/**
 * Read a value from KV.
 */
export async function kvGet(key: string): Promise<string | null> {
  const res = await fetch(
    `${CF_BASE}/storage/kv/namespaces/${KV_NS_ID}/values/${encodeURIComponent(key)}`,
    { method: "GET", headers: { Authorization: `Bearer ${API_TOKEN}` } },
  );

  if (res.status === 404) return null;
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`KV GET failed (${res.status}): ${text}`);
  }

  return res.text();
}

/**
 * Write a value to KV.
 *
 * @param ttl  Optional TTL in seconds
 */
export async function kvPut(
  key: string,
  value: string,
  ttl?: number,
): Promise<void> {
  const url = new URL(
    `${CF_BASE}/storage/kv/namespaces/${KV_NS_ID}/values/${encodeURIComponent(key)}`,
  );
  if (ttl) url.searchParams.set("expiration_ttl", String(ttl));

  const res = await fetch(url.toString(), {
    method: "PUT",
    headers: { Authorization: `Bearer ${API_TOKEN}`, "Content-Type": "text/plain" },
    body: value,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`KV PUT failed (${res.status}): ${text}`);
  }
}

/**
 * Delete a key from KV.
 */
export async function kvDelete(key: string): Promise<void> {
  const res = await fetch(
    `${CF_BASE}/storage/kv/namespaces/${KV_NS_ID}/values/${encodeURIComponent(key)}`,
    { method: "DELETE", headers: { Authorization: `Bearer ${API_TOKEN}` } },
  );

  if (!res.ok && res.status !== 404) {
    const text = await res.text();
    throw new Error(`KV DELETE failed (${res.status}): ${text}`);
  }
}
