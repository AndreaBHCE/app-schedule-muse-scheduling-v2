import { NextResponse } from "next/server";
import { d1Query } from "@/lib/cloudflare";
import { resolveAuth, AuthError } from "@/lib/auth";
import { requireScope } from "@/lib/apikey";
import { dispatchWebhooks } from "@/lib/webhooks";
import { waitUntil } from "@vercel/functions";

interface MeetingRow {
  id: string;
  booking_page_id: string;
  attendee_email: string;
  meeting_type: string;
  start_time: string;
  end_time: string;
  status: string;
  location_type: string;
  location_details: string;
  notes: string;
  canceled_reason: string;
  created_at: string;
  updated_at: string;
  /* Joined from contacts */
  first_name: string;
  last_name: string;
  phone: string;
  company: string;
}

function formatMeeting(row: MeetingRow) {
  return {
    id: row.id,
    bookingPageId: row.booking_page_id,
    attendeeEmail: row.attendee_email,
    firstName: row.first_name ?? "",
    lastName: row.last_name ?? "",
    phone: row.phone ?? "",
    company: row.company ?? "",
    meetingType: row.meeting_type,
    startTime: row.start_time,
    endTime: row.end_time,
    status: row.status,
    location: row.location_type,
    locationDetails: row.location_details,
    notes: row.notes,
    canceledReason: row.canceled_reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/* ── GET /api/meetings/:id ──────────────────────────────── */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId, scopes } = await resolveAuth(request);
    requireScope(scopes, "meetings:read");
    const { id } = await params;

    const result = await d1Query<MeetingRow>(
      `SELECT m.*, c.first_name, c.last_name, c.phone, c.company
       FROM meetings m
       LEFT JOIN contacts c ON c.email = m.attendee_email AND c.user_id = m.user_id
       WHERE m.id = ? AND m.user_id = ?`,
      [id, userId],
    );
    const row = result.results[0];

    if (!row) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    return NextResponse.json({ meeting: formatMeeting(row) });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("GET /api/meetings/:id error:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

/* ── PATCH /api/meetings/:id ────────────────────────────── */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId, scopes } = await resolveAuth(request);
    requireScope(scopes, "meetings:write");
    const { id } = await params;
    const { status, canceledReason } = await request.json();

    const allowedStatuses = ["confirmed", "canceled", "completed", "no-show"];
    if (!status || !allowedStatuses.includes(status)) {
      return NextResponse.json(
        { error: `status must be one of: ${allowedStatuses.join(", ")}` },
        { status: 400 },
      );
    }

    // Verify the meeting belongs to this user
    const existing = await d1Query<{ id: string }>(
      `SELECT id FROM meetings WHERE id = ? AND user_id = ?`,
      [id, userId],
    );
    if (existing.results.length === 0) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    await d1Query(
      `UPDATE meetings SET status = ?, canceled_reason = ?, updated_at = datetime('now') WHERE id = ? AND user_id = ?`,
      [status, canceledReason || "", id, userId],
    );

    // Dispatch webhook for cancellation (runs after response via waitUntil)
    if (status === "canceled") {
      waitUntil(dispatchWebhooks(userId, "meeting.canceled", {
        meeting: { id, status, canceledReason },
      }));
    }

    return NextResponse.json({ success: true, id, status });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("PATCH /api/meetings/:id error:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

/* ── DELETE /api/meetings/:id ───────────────────────────── */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId, scopes } = await resolveAuth(request);
    requireScope(scopes, "meetings:write");
    const { id } = await params;

    await d1Query(
      `DELETE FROM meetings WHERE id = ? AND user_id = ?`,
      [id, userId],
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("DELETE /api/meetings/:id error:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
