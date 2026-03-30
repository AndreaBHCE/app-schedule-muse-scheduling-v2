import { NextResponse } from "next/server";
import { d1Query } from "@/lib/cloudflare";
import { resolveAuth, AuthError } from "@/lib/auth";
import { requireScope } from "@/lib/apikey";

interface MeetingRow {
  id: string;
  booking_page_id: string;
  attendee_email: string;
  start_time: string;
  end_time: string;
  status: string;
  location_type: string;
  location_details: string;
  notes: string;
  canceled_reason: string;
  created_at: string;
  /* Joined from contacts */
  first_name: string;
  last_name: string;
  /* Joined from booking_pages */
  meeting_type: string;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const range = url.searchParams.get("range") || "day";
  const dateParam = url.searchParams.get("date");
  const search = url.searchParams.get("search")?.trim() || "";

  const anchor = dateParam ? new Date(dateParam + "T00:00:00") : new Date();
  anchor.setHours(0, 0, 0, 0);

  let rangeStart: Date;
  let rangeEnd: Date;

  if (range === "day") {
    rangeStart = new Date(anchor);
    rangeEnd = new Date(anchor);
    rangeEnd.setDate(rangeEnd.getDate() + 1);
  } else if (range === "week") {
    rangeStart = new Date(anchor);
    const day = rangeStart.getDay();
    const diff = day === 0 ? -6 : 1 - day; // Monday-first
    rangeStart.setDate(rangeStart.getDate() + diff);
    rangeEnd = new Date(rangeStart);
    rangeEnd.setDate(rangeEnd.getDate() + 7);
  } else {
    rangeStart = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    rangeEnd = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1);
  }

  try {
    const { userId, scopes } = await resolveAuth(request);
    requireScope(scopes, "events:read");
    let sql = `SELECT m.*, bp.title as meeting_type, c.first_name, c.last_name
       FROM meetings m
       JOIN booking_pages bp ON m.booking_page_id = bp.id
       LEFT JOIN contacts c ON c.email = m.attendee_email AND c.user_id = m.user_id
       WHERE m.user_id = ?
         AND m.start_time >= ?
         AND m.start_time < ?`;
    const params: (string | number)[] = [userId, rangeStart.toISOString(), rangeEnd.toISOString()];

    if (search) {
      const q = `%${search}%`;
      sql += ` AND (c.first_name LIKE ? OR c.last_name LIKE ? OR m.attendee_email LIKE ? OR bp.title LIKE ?)`;
      params.push(q, q, q, q);
    }

    sql += ` ORDER BY m.start_time ASC`;

    const result = await d1Query<MeetingRow>(sql, params);

    const events = result.results.map((row) => ({
      id: row.id,
      startTime: row.start_time,
      endTime: row.end_time,
      attendeeEmail: row.attendee_email,
      firstName: row.first_name ?? "",
      lastName: row.last_name ?? "",
      meetingType: row.meeting_type,
      status: row.status as "confirmed" | "pending" | "canceled" | "completed" | "no-show",
      location: row.location_type as "virtual" | "phone" | "in-person",
      locationDetails: row.location_details,
      notes: row.notes,
    }));

    return NextResponse.json({ events });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("GET /api/events error:", err);
    return NextResponse.json({ events: [], error: (err as Error).message }, { status: 500 });
  }
}
