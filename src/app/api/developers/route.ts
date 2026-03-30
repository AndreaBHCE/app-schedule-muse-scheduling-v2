import { NextResponse } from "next/server";
import { d1Query } from "@/lib/cloudflare";
import { resolveAuth, AuthError } from "@/lib/auth";
import { VALID_SCOPES } from "@/lib/apikey";
import { requiredString, validUrl } from "@/lib/validate";
import crypto from "crypto";

/* ── API Keys ─────────────────────────────────────────── */

interface ApiKeyRow {
  id: string;
  name: string;
  key_prefix: string;
  key_hash: string;
  scopes: string;
  last_used_at: string;
  expires_at: string;
  created_at: string;
}

interface WebhookRow {
  id: string;
  url: string;
  events: string;
  secret: string;
  active: number;
  last_triggered_at: string;
  last_status_code: number;
  created_at: string;
  updated_at: string;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const resource = url.searchParams.get("resource") || "all";

  try {
    const { userId } = await resolveAuth(request);
    const response: Record<string, unknown> = {};

    if (resource === "all" || resource === "keys") {
      const keys = await d1Query<ApiKeyRow>(
        `SELECT id, name, key_prefix, scopes, last_used_at, expires_at, created_at
         FROM api_keys WHERE user_id = ? ORDER BY created_at DESC`,
        [userId],
      );
      response.apiKeys = keys.results.map((k) => ({
        id: k.id,
        name: k.name,
        keyPrefix: k.key_prefix,
        scopes: JSON.parse(k.scopes || "[]"),
        lastUsedAt: k.last_used_at,
        expiresAt: k.expires_at,
        createdAt: k.created_at,
      }));
    }

    if (resource === "all" || resource === "webhooks") {
      const hooks = await d1Query<WebhookRow>(
        `SELECT * FROM webhooks WHERE user_id = ? ORDER BY created_at DESC`,
        [userId],
      );
      response.webhooks = hooks.results.map((h) => ({
        id: h.id,
        url: h.url,
        events: JSON.parse(h.events || "[]"),
        active: !!h.active,
        lastTriggeredAt: h.last_triggered_at,
        lastStatusCode: h.last_status_code,
        createdAt: h.created_at,
      }));
    }

    return NextResponse.json(response);
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("GET /api/developers error:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await resolveAuth(request);
    const { type, ...payload } = await request.json();

    if (type === "key") {
      const nameErr = requiredString("name", payload.name);
      if (nameErr) return NextResponse.json({ error: nameErr }, { status: 400 });

      const rawKey = `smuse_${crypto.randomBytes(24).toString("hex")}`;
      const id = `key-${crypto.randomUUID()}`;
      const prefix = rawKey.slice(0, 12) + "...";
      const hash = crypto.createHash("sha256").update(rawKey).digest("hex");

      // Validate scopes
      const requestedScopes: string[] = payload.scopes || ["meetings:read"];
      const invalidScopes = requestedScopes.filter((s: string) => !(VALID_SCOPES as readonly string[]).includes(s));
      if (invalidScopes.length > 0) {
        return NextResponse.json(
          { error: `Invalid scopes: ${invalidScopes.join(", ")}. Valid scopes: ${VALID_SCOPES.join(", ")}` },
          { status: 400 },
        );
      }

      await d1Query(
        `INSERT INTO api_keys (id, user_id, name, key_prefix, key_hash, scopes, expires_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          id, userId, payload.name.trim(), prefix, hash,
          JSON.stringify(requestedScopes),
          payload.expiresAt || null,
        ],
      );

      // Return the full key ONCE — never stored in plaintext
      return NextResponse.json({ apiKey: { id, name: payload.name.trim(), key: rawKey, prefix } }, { status: 201 });
    }

    if (type === "webhook") {
      const urlErr = validUrl("url", payload.url);
      if (urlErr) return NextResponse.json({ error: urlErr }, { status: 400 });

      const id = `wh-${crypto.randomUUID()}`;
      const secret = `whsec_${crypto.randomBytes(16).toString("hex")}`;

      await d1Query(
        `INSERT INTO webhooks (id, user_id, url, events, secret, active)
         VALUES (?, ?, ?, ?, ?, 1)`,
        [id, userId, payload.url.trim(), JSON.stringify(payload.events || ["meeting.created"]), secret],
      );

      return NextResponse.json({ webhook: { id, url: payload.url.trim(), secret } }, { status: 201 });
    }

    return NextResponse.json({ error: "type must be 'key' or 'webhook'" }, { status: 400 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("POST /api/developers error:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { userId } = await resolveAuth(request);
    const { type, id } = await request.json();
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    if (type === "key") {
      await d1Query(`DELETE FROM api_keys WHERE id = ? AND user_id = ?`, [id, userId]);
    } else if (type === "webhook") {
      await d1Query(`DELETE FROM webhooks WHERE id = ? AND user_id = ?`, [id, userId]);
    } else {
      return NextResponse.json({ error: "type must be 'key' or 'webhook'" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("DELETE /api/developers error:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
