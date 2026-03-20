import { NextResponse } from "next/server";
import { d1Query } from "@/lib/cloudflare";
import { getAuthUserId, AuthError } from "@/lib/auth";

interface ContactRow {
  id: string;
  name: string;
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

export async function GET(request: Request) {
  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";
  const tag = url.searchParams.get("tag") || "";

  try {
    const userId = await getAuthUserId();
    let sql = `SELECT * FROM contacts WHERE user_id = ?`;
    const params: (string | number)[] = [userId];

    if (search) {
      sql += ` AND (name LIKE ? OR email LIKE ? OR company LIKE ?)`;
      const q = `%${search}%`;
      params.push(q, q, q);
    }
    if (tag) {
      sql += ` AND tags LIKE ?`;
      params.push(`%${tag}%`);
    }

    sql += ` ORDER BY last_meeting_at DESC`;

    const result = await d1Query<ContactRow>(sql, params);

    const contacts = result.results.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      company: row.company,
      tags: JSON.parse(row.tags || "[]"),
      notes: row.notes,
      totalMeetings: row.total_meetings,
      lastMeetingAt: row.last_meeting_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return NextResponse.json({ contacts });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("GET /api/contacts error:", err);
    return NextResponse.json({ contacts: [], error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getAuthUserId();
    const payload = await request.json();
    if (!payload.name?.trim() || !payload.email?.trim()) {
      return NextResponse.json({ error: "name and email required" }, { status: 400 });
    }

    const id = `contact-${Date.now()}-${Math.round(Math.random() * 100000)}`;

    await d1Query(
      `INSERT INTO contacts (id, user_id, name, email, phone, company, tags, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, userId, payload.name.trim(), payload.email.trim(),
        payload.phone || "", payload.company || "",
        JSON.stringify(payload.tags || []), payload.notes || "",
      ],
    );

    return NextResponse.json({ contact: { id, name: payload.name.trim() } }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("POST /api/contacts error:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const userId = await getAuthUserId();
    const { id, ...fields } = await request.json();
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const sets: string[] = [];
    const params: (string | number)[] = [];

    for (const [key, value] of Object.entries(fields)) {
      const col = key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
      if (["name", "email", "phone", "company", "notes"].includes(col)) {
        sets.push(`${col} = ?`);
        params.push(value as string);
      } else if (col === "tags") {
        sets.push(`tags = ?`);
        params.push(JSON.stringify(value));
      }
    }

    if (sets.length === 0) return NextResponse.json({ error: "nothing to update" }, { status: 400 });

    sets.push(`updated_at = datetime('now')`);
    params.push(id, userId);

    await d1Query(`UPDATE contacts SET ${sets.join(", ")} WHERE id = ? AND user_id = ?`, params);

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("PATCH /api/contacts error:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const userId = await getAuthUserId();
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    await d1Query(`DELETE FROM contacts WHERE id = ? AND user_id = ?`, [id, userId]);
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("DELETE /api/contacts error:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
