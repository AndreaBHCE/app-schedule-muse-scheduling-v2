import { NextResponse } from "next/server";
import { d1Query } from "@/lib/cloudflare";

const DEMO_USER_ID = "user_demo_000";

interface IntegrationRow {
  id: string;
  provider: string;
  status: string;
  external_id: string;
  config: string;
  last_synced_at: string;
  created_at: string;
  updated_at: string;
}

export async function GET() {
  try {
    const result = await d1Query<IntegrationRow>(
      `SELECT * FROM integrations WHERE user_id = ? ORDER BY provider ASC`,
      [DEMO_USER_ID],
    );

    const integrations = result.results.map((row) => ({
      id: row.id,
      provider: row.provider,
      status: row.status,
      externalId: row.external_id,
      config: JSON.parse(row.config || "{}"),
      lastSyncedAt: row.last_synced_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return NextResponse.json({ integrations });
  } catch (err) {
    console.error("GET /api/integrations error:", err);
    return NextResponse.json({ integrations: [], error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { provider, externalId, config } = await request.json();
    if (!provider) return NextResponse.json({ error: "provider required" }, { status: 400 });

    const id = `int-${Date.now()}-${Math.round(Math.random() * 100000)}`;

    await d1Query(
      `INSERT INTO integrations (id, user_id, provider, status, external_id, config, last_synced_at)
       VALUES (?, ?, ?, 'connected', ?, ?, datetime('now'))`,
      [id, DEMO_USER_ID, provider, externalId || "", JSON.stringify(config || {})],
    );

    return NextResponse.json({ integration: { id, provider, status: "connected" } }, { status: 201 });
  } catch (err) {
    console.error("POST /api/integrations error:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, status } = await request.json();
    if (!id || !status) return NextResponse.json({ error: "id and status required" }, { status: 400 });

    const allowed = ["connected", "disconnected", "error"];
    if (!allowed.includes(status)) {
      return NextResponse.json({ error: `status must be one of: ${allowed.join(", ")}` }, { status: 400 });
    }

    await d1Query(
      `UPDATE integrations SET status = ?, updated_at = datetime('now') WHERE id = ? AND user_id = ?`,
      [status, id, DEMO_USER_ID],
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PATCH /api/integrations error:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    await d1Query(`DELETE FROM integrations WHERE id = ? AND user_id = ?`, [id, DEMO_USER_ID]);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/integrations error:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
