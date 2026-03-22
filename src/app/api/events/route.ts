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

function splitFullName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
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
    const userId = await getAuthUserId();
    let sql = `SELECT m.*, bp.title as meeting_type
       FROM meetings m
       JOIN booking_pages bp ON m.booking_page_id = bp.id
       WHERE m.user_id = ?
         AND m.start_time >= ?
         AND m.start_time < ?`;
    const params: (string | number)[] = [userId, rangeStart.toISOString(), rangeEnd.toISOString()];

    if (search) {
      const q = `%${search}%`;
      sql += ` AND (m.guest_name LIKE ? OR m.guest_email LIKE ? OR bp.title LIKE ?)`;
      params.push(q, q, q);
    }

    sql += ` ORDER BY m.start_time ASC`;

    const result = await d1Query<MeetingRow>(sql, params);

    const events = result.results.map((row) => {
      const { firstName, lastName } = splitFullName(row.guest_name);
      return {
        id: row.id,
        startTime: row.start_time,
        endTime: row.end_time,
        guestName: row.guest_name,
        guestFirstName: firstName,
        guestLastName: lastName,
        guestEmail: row.guest_email,
        meetingType: (row as MeetingRow & { meeting_type: string }).meeting_type,
        status: row.status as "confirmed" | "pending" | "canceled" | "completed" | "no-show",
        location: row.location_type as "virtual" | "phone" | "in-person",
        locationDetails: row.location_details,
        notes: row.notes,
      };
    });

    return NextResponse.json({ events });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("GET /api/events error:", err);
    return NextResponse.json({ events: [], error: (err as Error).message }, { status: 500 });
  }
}
