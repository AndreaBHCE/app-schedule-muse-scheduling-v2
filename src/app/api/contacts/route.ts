import { NextResponse } from "next/server";
import { d1Query } from "@/lib/cloudflare";
import { resolveAuth, AuthError } from "@/lib/auth";
import { requireScope } from "@/lib/apikey";
import { dispatchWebhooks } from "@/lib/webhooks";
import { formatContact, type ContactRow, type ContactPayload } from "@/lib/contacts";
import { firstError, requiredString, optionalString, validEmail, MAX_LONG } from "@/lib/validate";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";
  const tag = url.searchParams.get("tag") || "";

  try {
    const { userId, scopes } = await resolveAuth(request);
    requireScope(scopes, "contacts:read");
    let sql = `SELECT * FROM contacts WHERE user_id = ?`;
    const params: (string | number)[] = [userId];

    if (search) {
      const q = `%${search}%`;
      sql += ` AND (
          first_name LIKE ? OR
          last_name LIKE ? OR
          (first_name || ' ' || last_name) LIKE ? OR
          email LIKE ? OR
          company LIKE ?
        )`;
      params.push(q, q, q, q, q);
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
    const { userId, scopes } = await resolveAuth(request);
    requireScope(scopes, "contacts:write");
    const payload: ContactPayload = await request.json();

    const err = firstError(
      requiredString("firstName", payload.firstName),
      requiredString("lastName", payload.lastName),
      validEmail("email", payload.email),
      optionalString("phone", payload.phone),
      optionalString("company", payload.company),
      optionalString("notes", payload.notes, MAX_LONG),
    );
    if (err) return NextResponse.json({ error: err }, { status: 400 });

    const firstName = (payload.firstName || "").trim();
    const lastName = (payload.lastName || "").trim();
    const email = (payload.email || "").trim();

    const id = `contact-${crypto.randomUUID()}`;

    await d1Query(
      `INSERT INTO contacts (id, user_id, first_name, last_name, email, phone, company, tags, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        userId,
        firstName,
        lastName,
        email,
        payload.phone || "",
        payload.company || "",
        JSON.stringify(payload.tags || []),
        payload.notes || "",
      ],
    );

    const contact = { id, firstName, lastName };

    // Fire-and-forget: dispatch webhook event
    dispatchWebhooks(userId, "contact.created", { contact }).catch(() => {});

    return NextResponse.json({ contact }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("POST /api/contacts error:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
