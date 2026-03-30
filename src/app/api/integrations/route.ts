import { NextResponse } from "next/server";
import { d1Query } from "@/lib/cloudflare";
import { resolveAuth, AuthError } from "@/lib/auth";
import { encryptToken, decryptToken } from "@/lib/crypto";

interface IntegrationRow {
  id: string;
  provider: string;
  status: string;
  access_token: string;
  refresh_token: string;
  metadata: string;
  connected_at: string;
  created_at: string;
  updated_at: string;
}

export async function GET(request: Request) {
  try {
    const { userId } = await resolveAuth(request);
    const result = await d1Query<IntegrationRow>(
      `SELECT * FROM integrations WHERE user_id = ? ORDER BY provider ASC`,
      [userId],
    );

    const integrations = result.results.map((row) => {
      let metadata = {};
      try {
        metadata = JSON.parse(row.metadata || "{}");
      } catch (e) {
        console.error("Failed to parse metadata:", e);
      }
      return {
        id: row.id,
        provider: row.provider,
        status: row.status,
        metadata,
        connectedAt: row.connected_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    });

    return NextResponse.json({ integrations });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("GET /api/integrations error:", err);
    return NextResponse.json({ integrations: [], error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await resolveAuth(request);
    const { provider, accessToken, refreshToken, metadata } = await request.json();
    if (!provider) return NextResponse.json({ error: "provider required" }, { status: 400 });

    const id = `int-${crypto.randomUUID()}`;
    const encryptedAccess = accessToken ? encryptToken(accessToken) : "";
    const encryptedRefresh = refreshToken ? encryptToken(refreshToken) : "";

    await d1Query(
      `INSERT INTO integrations (id, user_id, provider, status, access_token, refresh_token, metadata, connected_at)
       VALUES (?, ?, ?, 'connected', ?, ?, ?, datetime('now'))`,
      [id, userId, provider, encryptedAccess, encryptedRefresh, JSON.stringify(metadata || {})],
    );

    return NextResponse.json({ integration: { id, provider, status: "connected" } }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("POST /api/integrations error:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { userId } = await resolveAuth(request);
    const { id, status } = await request.json();
    if (!id || !status) return NextResponse.json({ error: "id and status required" }, { status: 400 });

    const allowed = ["connected", "disconnected", "error"];
    if (!allowed.includes(status)) {
      return NextResponse.json({ error: `status must be one of: ${allowed.join(", ")}` }, { status: 400 });
    }

    // When disconnecting, delete stored tokens (required by Google API Services User Data Policy)
    if (status === "disconnected") {
      await d1Query(
        `UPDATE integrations SET status = ?, access_token = '', refresh_token = '', updated_at = datetime('now') WHERE id = ? AND user_id = ?`,
        [status, id, userId],
      );
    } else {
      await d1Query(
        `UPDATE integrations SET status = ?, updated_at = datetime('now') WHERE id = ? AND user_id = ?`,
        [status, id, userId],
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("PATCH /api/integrations error:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { userId } = await resolveAuth(request);
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    await d1Query(`DELETE FROM integrations WHERE id = ? AND user_id = ?`, [id, userId]);
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("DELETE /api/integrations error:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
