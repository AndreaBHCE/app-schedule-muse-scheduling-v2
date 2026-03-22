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

interface ContactPayload {
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  tags?: string[];
  notes?: string;
}

export function formatContact(row: ContactRow) {
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

export function splitName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/);
  if (parts.length <= 1) {
    return { firstName: parts[0] || "", lastName: "" };
  }
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
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
      const q = `%${search}%`;
      sql += ` AND (
          first_name LIKE ? OR
          last_name LIKE ? OR
          (first_name || ' ' || last_name) LIKE ? OR
          name LIKE ? OR
          email LIKE ? OR
          company LIKE ?
        )`;
      params.push(q, q, q, q, q, q);
    }
    if (tag) {
      sql += ` AND tags LIKE ?`;
      params.push(`%${tag}%`);
    }

    sql += ` ORDER BY last_meeting_at DESC`;

    const result = await d1Query<ContactRow>(sql, params);
    const contacts = result.results.map(formatContact);

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
    const payload: ContactPayload = await request.json();

    let firstName = (payload.firstName || "").trim();
    let lastName = (payload.lastName || "").trim();

    if (!firstName && !lastName && payload.name) {
      const fromName = splitName(payload.name);
      firstName = fromName.firstName;
      lastName = fromName.lastName;
    }

    if (!firstName && !lastName) {
      return NextResponse.json({ error: "firstName and/or lastName required" }, { status: 400 });
    }
    if (!payload.email?.trim()) {
      return NextResponse.json({ error: "email required" }, { status: 400 });
    }

    const id = `contact-${Date.now()}-${Math.round(Math.random() * 100000)}`;

    await d1Query(
      `INSERT INTO contacts (id, user_id, first_name, last_name, name, email, phone, company, tags, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        userId,
        firstName,
        lastName,
        [firstName, lastName].filter(Boolean).join(" "),
        payload.email.trim(),
        payload.phone || "",
        payload.company || "",
        JSON.stringify(payload.tags || []),
        payload.notes || "",
      ],
    );

    return NextResponse.json({ contact: { id, firstName, lastName, name: [firstName, lastName].filter(Boolean).join(" ") } }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("POST /api/contacts error:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const userId = await getAuthUserId();
    const { id, ...fields } = await request.json() as { id?: string } & ContactPayload;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const sets: string[] = [];
    const params: (string | number)[] = [];

    if (fields.name && (!fields.firstName || !fields.lastName)) {
      const parsed = splitName(fields.name);
      fields.firstName = fields.firstName || parsed.firstName;
      fields.lastName = fields.lastName || parsed.lastName;
    }

    for (const [key, value] of Object.entries(fields)) {
      if (key === "firstName") {
        sets.push(`first_name = ?`);
        params.push((value as string).trim());
      } else if (key === "lastName") {
        sets.push(`last_name = ?`);
        params.push((value as string).trim());
      } else if (key === "name") {
        // already normalized by splitName above
        const parsed = splitName(value as string);
        sets.push(`name = ?`);
        params.push((value as string).trim());
        if (!fields.firstName) {
          sets.push(`first_name = ?`);
          params.push(parsed.firstName);
        }
        if (!fields.lastName) {
          sets.push(`last_name = ?`);
          params.push(parsed.lastName);
        }
      } else if (key === "email") {
        sets.push(`email = ?`);
        params.push((value as string).trim());
      } else if (key === "phone") {
        sets.push(`phone = ?`);
        params.push((value as string).trim());
      } else if (key === "company") {
        sets.push(`company = ?`);
        params.push((value as string).trim());
      } else if (key === "notes") {
        sets.push(`notes = ?`);
        params.push((value as string).trim());
      } else if (key === "tags") {
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
