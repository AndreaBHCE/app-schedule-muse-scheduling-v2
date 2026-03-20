import { NextResponse } from "next/server";
import { d1Query } from "@/lib/cloudflare";
import crypto from "crypto";

const DEMO_USER_ID = "user_demo_000";

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
    const response: Record<string, unknown> = {};

    if (resource === "all" || resource === "keys") {
      const keys = await d1Query<ApiKeyRow>(
        `SELECT id, name, key_prefix, scopes, last_used_at, expires_at, created_at
         FROM api_keys WHERE user_id = ? ORDER BY created_at DESC`,
        [DEMO_USER_ID],
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
        [DEMO_USER_ID],
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
    console.error("GET /api/developers error:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { type, ...payload } = await request.json();

    if (type === "key") {
      if (!payload.name?.trim()) return NextResponse.json({ error: "name required" }, { status: 400 });

      const rawKey = `smuse_${crypto.randomBytes(24).toString("hex")}`;
      const id = `key-${Date.now()}`;
      const prefix = rawKey.slice(0, 12) + "...";
      const hash = crypto.createHash("sha256").update(rawKey).digest("hex");

      await d1Query(
        `INSERT INTO api_keys (id, user_id, name, key_prefix, key_hash, scopes, expires_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          id, DEMO_USER_ID, payload.name.trim(), prefix, hash,
          JSON.stringify(payload.scopes || ["read"]),
          payload.expiresAt || null,
        ],
      );

      // Return the full key ONCE — never stored in plaintext
      return NextResponse.json({ apiKey: { id, name: payload.name.trim(), key: rawKey, prefix } }, { status: 201 });
    }

    if (type === "webhook") {
      if (!payload.url?.trim()) return NextResponse.json({ error: "url required" }, { status: 400 });

      const id = `wh-${Date.now()}`;
      const secret = `whsec_${crypto.randomBytes(16).toString("hex")}`;

      await d1Query(
        `INSERT INTO webhooks (id, user_id, url, events, secret, active)
         VALUES (?, ?, ?, ?, ?, 1)`,
        [id, DEMO_USER_ID, payload.url.trim(), JSON.stringify(payload.events || ["meeting.created"]), secret],
      );

      return NextResponse.json({ webhook: { id, url: payload.url.trim(), secret } }, { status: 201 });
    }

    return NextResponse.json({ error: "type must be 'key' or 'webhook'" }, { status: 400 });
  } catch (err) {
    console.error("POST /api/developers error:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { type, id } = await request.json();
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    if (type === "key") {
      await d1Query(`DELETE FROM api_keys WHERE id = ? AND user_id = ?`, [id, DEMO_USER_ID]);
    } else if (type === "webhook") {
      await d1Query(`DELETE FROM webhooks WHERE id = ? AND user_id = ?`, [id, DEMO_USER_ID]);
    } else {
      return NextResponse.json({ error: "type must be 'key' or 'webhook'" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/developers error:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
