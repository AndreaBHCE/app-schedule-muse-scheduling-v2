import { NextResponse } from "next/server";
import { d1Query } from "@/lib/cloudflare";
import { resolveAuth, AuthError } from "@/lib/auth";
import { requireScope } from "@/lib/apikey";
import { dispatchWebhooks } from "@/lib/webhooks";
import {
  firstError,
  requiredString,
  optionalString,
  positiveInt,
  MAX_LONG,
  MAX_JSON,
} from "@/lib/validate";

interface BookingPageRow {
  id: string;
  title: string;
  slug: string;
  description: string;
  duration_minutes: number;
  buffer_minutes: number;
  status: string;
  color: string;
  location_type: string;
  location_details: string;
  config: string;
  bookings_last_7d: number;
  conversion_delta_pct: number;
  created_at: string;
  updated_at: string;
}

export async function GET(request: Request) {
  try {
    const { userId, scopes } = await resolveAuth(request);
    requireScope(scopes, "bookings:read");
    const result = await d1Query<BookingPageRow>(
      `SELECT * FROM booking_pages WHERE user_id = ? ORDER BY updated_at DESC`,
      [userId],
    );

    const bookings = result.results.map((row) => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      description: row.description,
      durationMinutes: row.duration_minutes,
      bufferMinutes: row.buffer_minutes,
      status: row.status.charAt(0).toUpperCase() + row.status.slice(1) as "Published" | "Draft" | "Paused",
      color: row.color,
      locationType: row.location_type,
      locationDetails: row.location_details,
      config: JSON.parse(row.config || "{}"),
      bookingsLast7Days: row.bookings_last_7d,
      conversionDeltaPercent: row.conversion_delta_pct,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return NextResponse.json({ bookings });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("GET /api/bookings error:", err);
    return NextResponse.json({ bookings: [], error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId, scopes } = await resolveAuth(request);
    requireScope(scopes, "bookings:write");
    const payload = await request.json();

    const err = firstError(
      requiredString("title", payload.title),
      positiveInt("durationMinutes", payload.durationMinutes),
      optionalString("description", payload.description, MAX_LONG),
      optionalString("locationDetails", payload.locationDetails),
      optionalString("locationType", payload.locationType),
    );
    if (err) return NextResponse.json({ error: err }, { status: 400 });

    // Reject oversized config blobs
    if (payload.config && JSON.stringify(payload.config).length > MAX_JSON) {
      return NextResponse.json({ error: `config must be ${MAX_JSON} characters or fewer` }, { status: 400 });
    }

    const id = `bp-${Date.now()}-${Math.round(Math.random() * 100000)}`;
    const slug = payload.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    // Check slug uniqueness for this user before INSERT
    const existing = await d1Query<{ id: string }>(
      `SELECT id FROM booking_pages WHERE user_id = ? AND slug = ?`,
      [userId, slug],
    );
    if (existing.results.length > 0) {
      return NextResponse.json(
        { error: `A booking page with the slug "${slug}" already exists. Choose a different title.` },
        { status: 409 },
      );
    }

    await d1Query(
      `INSERT INTO booking_pages (id, user_id, title, slug, description, duration_minutes, buffer_minutes, status, color, location_type, location_details, config)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, userId, payload.title.trim(), slug,
        payload.description || "", payload.durationMinutes, payload.bufferMinutes || 0,
        "published", payload.color || "#0d9488",
        payload.locationType || "virtual", payload.locationDetails || "",
        JSON.stringify(payload.config || {}),
      ],
    );

    const booking = { id, title: payload.title.trim(), status: "Published" };

    // Fire-and-forget: dispatch webhook event
    dispatchWebhooks(userId, "booking_page.created", { booking }).catch(() => {});

    return NextResponse.json({ booking }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("POST /api/bookings error:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
