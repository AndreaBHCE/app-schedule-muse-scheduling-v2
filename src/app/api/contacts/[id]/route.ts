import { NextResponse } from "next/server";
import { d1Query } from "@/lib/cloudflare";
import { getAuthUserId, AuthError } from "@/lib/auth";

interface ContactRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  name: string | null;
  email: string;
  phone: string;
  company: string;
  tags: string;
  notes: string;
  total_meetings: number;
  last_meeting_at: string;
  created_at: string;
  updated_at: string;
}

function formatContact(row: ContactRow) {
  const firstName = (row.first_name || "").trim();
  const lastName = (row.last_name || "").trim();
  const fullNameFromSplit = [firstName, lastName].filter(Boolean).join(" ");
  const fallbackName = (row.name || "").trim();
  const fullName = fullNameFromSplit || fallbackName;

  return {
    id: row.id,
    firstName,
    lastName,
    name: fullName,
    email: row.email,
    phone: row.phone,
    company: row.company,
    tags: JSON.parse(row.tags || "[]"),
    notes: row.notes,
    totalMeetings: row.total_meetings,
    lastMeetingAt: row.last_meeting_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function splitName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/);
  if (parts.length <= 1) return { firstName: parts[0] || "", lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

export async function GET(request: Request, context: any) {
  try {
    const userId = await getAuthUserId();
    const params = await context.params;
    const id = params.id;

    const result = await d1Query<ContactRow>(`SELECT * FROM contacts WHERE id = ? AND user_id = ?`, [id, userId]);
    const row = result.results[0];

    if (!row) return NextResponse.json({ error: "Contact not found" }, { status: 404 });

    return NextResponse.json({ contact: formatContact(row) });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("GET /api/contacts/:id error:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function PUT(request: Request, context: any) {
  try {
    const userId = await getAuthUserId();
    const params = await context.params;
    const id = params.id;
    const payload = await request.json();

    let firstName = (payload.firstName || "").trim();
    let lastName = (payload.lastName || "").trim();

    if (!firstName && !lastName && payload.name) {
      const parsed = splitName(payload.name);
      firstName = parsed.firstName;
      lastName = parsed.lastName;
    }

    if (!firstName && !lastName) {
      return NextResponse.json({ error: "firstName and/or lastName required" }, { status: 400 });
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

    sets.push(`name = ?`);
    paramsArr.push([firstName, lastName].filter(Boolean).join(" ")); // keep backward compat
    sets.push(`updated_at = datetime('now')`);

    paramsArr.push(id, userId);

    await d1Query(`UPDATE contacts SET ${sets.join(", ")} WHERE id = ? AND user_id = ?`, paramsArr);

    const updated = await d1Query<ContactRow>(`SELECT * FROM contacts WHERE id = ? AND user_id = ?`, [id, userId]);
    if (!updated.results.length) return NextResponse.json({ error: "Contact not found" }, { status: 404 });

    return NextResponse.json({ contact: formatContact(updated.results[0]) });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("PUT /api/contacts/:id error:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: any) {
  try {
    const userId = await getAuthUserId();
    const params = await context.params;
    const id = params.id;

    await d1Query(`DELETE FROM contacts WHERE id = ? AND user_id = ?`, [id, userId]);
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("DELETE /api/contacts/:id error:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
