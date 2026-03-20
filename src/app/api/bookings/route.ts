import { NextResponse } from "next/server";
import { d1Query } from "@/lib/cloudflare";

// For now, use the demo user. Once Clerk is wired in per-request, swap for auth().userId
const DEMO_USER_ID = "user_demo_000";

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

export async function GET() {
  try {
    const result = await d1Query<BookingPageRow>(
      `SELECT * FROM booking_pages WHERE user_id = ? ORDER BY updated_at DESC`,
      [DEMO_USER_ID],
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
    console.error("GET /api/bookings error:", err);
    return NextResponse.json({ bookings: [], error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    if (!payload.title?.trim() || !payload.durationMinutes || payload.durationMinutes <= 0) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const id = `bp-${Date.now()}-${Math.round(Math.random() * 100000)}`;
    const slug = payload.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    await d1Query(
      `INSERT INTO booking_pages (id, user_id, title, slug, description, duration_minutes, buffer_minutes, status, color, location_type, location_details, config)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, DEMO_USER_ID, payload.title.trim(), slug,
        payload.description || "", payload.durationMinutes, payload.bufferMinutes || 0,
        "published", payload.color || "#0d9488",
        payload.locationType || "virtual", payload.locationDetails || "",
        JSON.stringify(payload.config || {}),
      ],
    );

    return NextResponse.json({ booking: { id, title: payload.title.trim(), status: "Published" } }, { status: 201 });
  } catch (err) {
    console.error("POST /api/bookings error:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
