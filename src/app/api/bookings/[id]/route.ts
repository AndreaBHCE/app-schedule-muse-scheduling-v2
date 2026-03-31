import { NextResponse } from "next/server";
import { d1Query } from "@/lib/cloudflare";
import { resolveAuth, AuthError } from "@/lib/auth";
import { requireScope } from "@/lib/apikey";

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
  bookings_prev_7d: number;
  created_at: string;
  updated_at: string;
}

/* ── GET /api/bookings/:id ────────────────────────────────── */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId, scopes } = await resolveAuth(_request);
    requireScope(scopes, "bookings:read");
    const { id } = await params;

    const result = await d1Query<BookingPageRow>(
      `SELECT bp.*,
         (SELECT COUNT(*) FROM meetings m
          WHERE m.booking_page_id = bp.id
            AND m.created_at > datetime('now', '-7 days')) AS bookings_last_7d,
         (SELECT COUNT(*) FROM meetings m
          WHERE m.booking_page_id = bp.id
            AND m.created_at > datetime('now', '-14 days')
            AND m.created_at <= datetime('now', '-7 days')) AS bookings_prev_7d
       FROM booking_pages bp
       WHERE bp.id = ? AND bp.user_id = ?`,
      [id, userId],
    );

    if (!result.results.length) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const row = result.results[0];
    const last7 = row.bookings_last_7d ?? 0;
    const prev7 = row.bookings_prev_7d ?? 0;
    const delta = prev7 === 0 ? (last7 > 0 ? 100 : 0) : Math.round(((last7 - prev7) / prev7) * 1000) / 10;

    return NextResponse.json({
      booking: {
        id: row.id,
        title: row.title,
        slug: row.slug,
        description: row.description,
        durationMinutes: row.duration_minutes,
        bufferMinutes: row.buffer_minutes,
        status: row.status.charAt(0).toUpperCase() + row.status.slice(1),
        color: row.color,
        locationType: row.location_type,
        locationDetails: row.location_details,
        config: JSON.parse(row.config || "{}"),
        bookingsLast7Days: last7,
        conversionDeltaPercent: delta,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
    });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("GET /api/bookings/:id error:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

/* ── PUT /api/bookings/:id ────────────────────────────────── */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId, scopes } = await resolveAuth(request);
    requireScope(scopes, "bookings:write");
    const { id } = await params;
    const payload = await request.json();

    // Verify ownership
    const check = await d1Query<BookingPageRow>(
      `SELECT id FROM booking_pages WHERE id = ? AND user_id = ?`,
      [id, userId],
    );
    if (!check.results.length) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const slug = payload.title
      ? payload.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
      : undefined;

    await d1Query(
      `UPDATE booking_pages
       SET title = COALESCE(?, title),
           slug = COALESCE(?, slug),
           description = COALESCE(?, description),
           duration_minutes = COALESCE(?, duration_minutes),
           buffer_minutes = COALESCE(?, buffer_minutes),
           color = COALESCE(?, color),
           location_type = COALESCE(?, location_type),
           location_details = COALESCE(?, location_details),
           config = COALESCE(?, config),
           updated_at = datetime('now')
       WHERE id = ? AND user_id = ?`,
      [
        payload.title?.trim() ?? null,
        slug ?? null,
        payload.description ?? null,
        payload.durationMinutes ?? null,
        payload.bufferMinutes ?? null,
        payload.color ?? null,
        payload.locationType ?? null,
        payload.locationDetails ?? null,
        payload.config ? JSON.stringify(payload.config) : null,
        id,
        userId,
      ],
    );

    // Re-fetch the updated row so the response reflects the real DB state
    const updated = await d1Query<BookingPageRow>(
      `SELECT bp.*,
         (SELECT COUNT(*) FROM meetings m
          WHERE m.booking_page_id = bp.id
            AND m.created_at > datetime('now', '-7 days')) AS bookings_last_7d,
         (SELECT COUNT(*) FROM meetings m
          WHERE m.booking_page_id = bp.id
            AND m.created_at > datetime('now', '-14 days')
            AND m.created_at <= datetime('now', '-7 days')) AS bookings_prev_7d
       FROM booking_pages bp
       WHERE bp.id = ? AND bp.user_id = ?`,
      [id, userId],
    );
    const row = updated.results[0];
    const last7 = row.bookings_last_7d ?? 0;
    const prev7 = row.bookings_prev_7d ?? 0;
    const delta = prev7 === 0 ? (last7 > 0 ? 100 : 0) : Math.round(((last7 - prev7) / prev7) * 1000) / 10;

    return NextResponse.json({
      booking: {
        id: row.id,
        title: row.title,
        slug: row.slug,
        description: row.description,
        durationMinutes: row.duration_minutes,
        bufferMinutes: row.buffer_minutes,
        status: row.status.charAt(0).toUpperCase() + row.status.slice(1),
        color: row.color,
        locationType: row.location_type,
        locationDetails: row.location_details,
        config: JSON.parse(row.config || "{}"),
        bookingsLast7Days: last7,
        conversionDeltaPercent: delta,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
    });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("PATCH /api/bookings/:id error:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

/* ── DELETE /api/bookings/:id ─────────────────────────────── */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId, scopes } = await resolveAuth(_request);
    requireScope(scopes, "bookings:write");
    const { id } = await params;

    // Verify ownership
    const check = await d1Query<BookingPageRow>(
      `SELECT id FROM booking_pages WHERE id = ? AND user_id = ?`,
      [id, userId],
    );
    if (!check.results.length) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    await d1Query(
      `DELETE FROM booking_pages WHERE id = ? AND user_id = ?`,
      [id, userId],
    );

    return NextResponse.json({ deleted: true });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("DELETE /api/bookings/:id error:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
