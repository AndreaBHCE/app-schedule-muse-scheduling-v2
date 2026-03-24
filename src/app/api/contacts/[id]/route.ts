import { NextResponse } from "next/server";
import { d1Query } from "@/lib/cloudflare";
import { resolveAuth, AuthError } from "@/lib/auth";
import { requireScope } from "@/lib/apikey";
import { formatContact, splitName, type ContactRow } from "@/lib/contacts";

/* ── GET /api/contacts/:id ──────────────────────────────── */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId, scopes } = await resolveAuth(request);
    requireScope(scopes, "contacts:read");
    const { id } = await params;

    const result = await d1Query<ContactRow>(
      `SELECT * FROM contacts WHERE id = ? AND user_id = ?`,
      [id, userId],
    );
    const row = result.results[0];

    if (!row) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    return NextResponse.json({ contact: formatContact(row) });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("GET /api/contacts/:id error:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

/* ── PUT /api/contacts/:id ──────────────────────────────── */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId, scopes } = await resolveAuth(request);
    requireScope(scopes, "contacts:write");
    const { id } = await params;
    const payload = await request.json();

    let firstName = (payload.firstName || "").trim();
    let lastName = (payload.lastName || "").trim();

    // If only a full name was provided, split it
    if (!firstName && !lastName && payload.name) {
      const parsed = splitName(payload.name);
      firstName = parsed.firstName;
      lastName = parsed.lastName;
    }

    if (!firstName && !lastName) {
      return NextResponse.json(
        { error: "firstName and/or lastName required" },
        { status: 400 },
      );
    }
    if (!payload.email?.trim()) {
      return NextResponse.json({ error: "email required" }, { status: 400 });
    }

    const sets: string[] = [];
    const paramsArr: (string | number)[] = [];

    sets.push(`first_name = ?`);
    paramsArr.push(firstName);

    sets.push(`last_name = ?`);
    paramsArr.push(lastName);

    // Keep legacy name column in sync
    sets.push(`name = ?`);
    paramsArr.push([firstName, lastName].filter(Boolean).join(" "));

    if (payload.email) {
      sets.push(`email = ?`);
      paramsArr.push(payload.email.trim());
    }
    if (payload.phone !== undefined) {
      sets.push(`phone = ?`);
      paramsArr.push((payload.phone || "").trim());
    }
    if (payload.company !== undefined) {
      sets.push(`company = ?`);
      paramsArr.push((payload.company || "").trim());
    }
    if (payload.notes !== undefined) {
      sets.push(`notes = ?`);
      paramsArr.push((payload.notes || "").trim());
    }
    if (payload.tags !== undefined) {
      sets.push(`tags = ?`);
      paramsArr.push(JSON.stringify(payload.tags || []));
    }

    sets.push(`updated_at = datetime('now')`);
    paramsArr.push(id, userId);

    await d1Query(
      `UPDATE contacts SET ${sets.join(", ")} WHERE id = ? AND user_id = ?`,
      paramsArr,
    );

    const updated = await d1Query<ContactRow>(
      `SELECT * FROM contacts WHERE id = ? AND user_id = ?`,
      [id, userId],
    );
    if (!updated.results.length) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    return NextResponse.json({ contact: formatContact(updated.results[0]) });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("PUT /api/contacts/:id error:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

/* ── DELETE /api/contacts/:id ───────────────────────────── */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId, scopes } = await resolveAuth(request);
    requireScope(scopes, "contacts:write");
    const { id } = await params;

    await d1Query(
      `DELETE FROM contacts WHERE id = ? AND user_id = ?`,
      [id, userId],
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("DELETE /api/contacts/:id error:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
