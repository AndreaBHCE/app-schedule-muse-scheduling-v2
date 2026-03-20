import { NextResponse } from "next/server";
import { d1Query } from "@/lib/cloudflare";
import { getAuthUserId, AuthError } from "@/lib/auth";

interface MeetingRow {
  id: string;
  booking_page_id: string;
  guest_name: string;
  guest_email: string;
  start_time: string;
  end_time: string;
  status: string;
  location_type: string;
  location_details: string;
  notes: string;
  canceled_reason: string;
  created_at: string;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const status = url.searchParams.get("status"); // upcoming | past | canceled | all
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "20");
  const offset = (page - 1) * limit;

  try {
    const userId = await getAuthUserId();
    const now = new Date().toISOString();
    let sql = `SELECT m.*, bp.title as meeting_type
               FROM meetings m
               JOIN booking_pages bp ON m.booking_page_id = bp.id
               WHERE m.user_id = ?`;
    const params: (string | number)[] = [userId];

    if (status === "upcoming") {
      sql += ` AND m.start_time >= ? AND m.status IN ('confirmed','pending')`;
      params.push(now);
    } else if (status === "past") {
      sql += ` AND (m.start_time < ? OR m.status IN ('completed','no-show'))`;
      params.push(now);
    } else if (status === "canceled") {
      sql += ` AND m.status = 'canceled'`;
    }

    // Count
    const countResult = await d1Query<{ cnt: number }>(
      sql.replace("SELECT m.*, bp.title as meeting_type", "SELECT COUNT(*) as cnt"),
      params,
    );
    const total = countResult.results[0]?.cnt ?? 0;

    sql += ` ORDER BY m.start_time DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const result = await d1Query<MeetingRow & { meeting_type: string }>(sql, params);

    const meetings = result.results.map((row) => ({
      id: row.id,
      bookingPageId: row.booking_page_id,
      meetingType: row.meeting_type,
      guestName: row.guest_name,
      guestEmail: row.guest_email,
      startTime: row.start_time,
      endTime: row.end_time,
      status: row.status,
      locationType: row.location_type,
      locationDetails: row.location_details,
      notes: row.notes,
      canceledReason: row.canceled_reason,
      createdAt: row.created_at,
    }));

    return NextResponse.json({ meetings, total, page, limit });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("GET /api/meetings error:", err);
    return NextResponse.json({ meetings: [], error: (err as Error).message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const userId = await getAuthUserId();
    const { id, status, canceledReason } = await request.json();
    if (!id || !status) {
      return NextResponse.json({ error: "id and status required" }, { status: 400 });
    }

    const allowed = ["confirmed", "pending", "canceled", "completed", "no-show"];
    if (!allowed.includes(status)) {
      return NextResponse.json({ error: `status must be one of: ${allowed.join(", ")}` }, { status: 400 });
    }

    await d1Query(
      `UPDATE meetings SET status = ?, canceled_reason = ?, updated_at = datetime('now')
       WHERE id = ? AND user_id = ?`,
      [status, canceledReason || null, id, userId],
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("PATCH /api/meetings error:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
