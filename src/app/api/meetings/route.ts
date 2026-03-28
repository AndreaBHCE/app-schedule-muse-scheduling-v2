import { NextRequest, NextResponse } from "next/server";
import { resolveAuth, AuthError } from "@/lib/auth";
import { requireScope } from "@/lib/apikey";
import { d1Query } from "@/lib/cloudflare";
import { createZoomMeeting } from "@/lib/zoom";
import { dispatchWebhooks } from "@/lib/webhooks";
import {
  firstError,
  requiredString,
  validEmail,
  validISODate,
  optionalString,
  MAX_LONG,
} from "@/lib/validate";

interface MeetingData {
  booking_page_id?: string;
  guest_name: string;
  guest_email: string;
  meeting_type?: string;
  start_time: string;
  end_time: string;
  location?: string;
  location_details?: string;
  notes?: string;
}

interface MeetingRow {
  id: string;
  booking_page_id: string;
  guest_name: string;
  guest_email: string;
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
}

function formatMeeting(row: MeetingRow) {
  return {
    id: row.id,
    bookingPageId: row.booking_page_id,
    guestName: row.guest_name,
    guestEmail: row.guest_email,
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

/**
 * Build a SQL WHERE clause fragment for the status filter tabs.
 *
 * - "upcoming":  confirmed or pending, start_time in the future
 * - "past":      completed, or start_time in the past (regardless of status)
 * - "canceled":  status = 'canceled' or 'no-show'
 * - "all":       no extra filter
 */
function statusFilter(tab: string): { clause: string; params: unknown[] } {
  const now = new Date().toISOString();
  switch (tab) {
    case "upcoming":
      return {
        clause: `AND status IN ('confirmed', 'pending') AND start_time >= ?`,
        params: [now],
      };
    case "past":
      return {
        clause: `AND (status = 'completed' OR (status NOT IN ('canceled', 'no-show') AND start_time < ?))`,
        params: [now],
      };
    case "canceled":
      return {
        clause: `AND status IN ('canceled', 'no-show')`,
        params: [],
      };
    default:
      // "all" or unrecognized — return everything
      return { clause: "", params: [] };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, scopes } = await resolveAuth(request);
    requireScope(scopes, "meetings:write");
    const data: MeetingData = await request.json();

    // Validate required fields with proper format checks
    const err = firstError(
      requiredString("guest_name", data.guest_name),
      validEmail("guest_email", data.guest_email),
      validISODate("start_time", data.start_time),
      validISODate("end_time", data.end_time),
      optionalString("meeting_type", data.meeting_type),
      optionalString("location", data.location),
      optionalString("location_details", data.location_details),
      optionalString("notes", data.notes, MAX_LONG),
    );
    if (err) return NextResponse.json({ error: err }, { status: 400 });

    // Calculate duration in minutes
    const startTime = new Date(data.start_time);
    const endTime = new Date(data.end_time);
    const duration = Math.round(
      (endTime.getTime() - startTime.getTime()) / (1000 * 60),
    );

    if (duration <= 0) {
      return NextResponse.json(
        { error: "End time must be after start time" },
        { status: 400 },
      );
    }

    // Check if user has Zoom integration
    const zoomIntegration = await d1Query(
      `SELECT id FROM integrations WHERE user_id = ? AND provider = 'zoom' AND status = 'connected'`,
      [userId],
    );

    let zoomMeeting = null;
    let locationDetails = data.location_details || "";

    // Create Zoom meeting if integration exists
    if (zoomIntegration.results && zoomIntegration.results.length > 0) {
      const meetingTopic = `${data.guest_name} - ${data.meeting_type || "Meeting"}`;
      const zoomStartTime = startTime.toISOString();

      zoomMeeting = await createZoomMeeting(userId, {
        topic: meetingTopic,
        start_time: zoomStartTime,
        duration: duration,
        timezone: "UTC",
        agenda: data.notes || "",
      });

      if (zoomMeeting) {
        locationDetails = zoomMeeting.join_url;
      }
    }

    // Create meeting record in database
    const meetingId = `meeting-${crypto.randomUUID()}`;

    await d1Query(
      `INSERT INTO meetings (
        id, user_id, booking_page_id, guest_name, guest_email, meeting_type,
        start_time, end_time, status, location_type, location_details, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', ?, ?, ?)`,
      [
        meetingId,
        userId,
        data.booking_page_id || null,
        data.guest_name,
        data.guest_email,
        data.meeting_type || "",
        data.start_time,
        data.end_time,
        data.location || "virtual",
        locationDetails,
        data.notes || "",
      ],
    );

    const meeting = {
      id: meetingId,
      guest_name: data.guest_name,
      guest_email: data.guest_email,
      start_time: data.start_time,
      end_time: data.end_time,
      location: data.location || "virtual",
      location_details: locationDetails,
      zoom_meeting: zoomMeeting,
      created: true,
    };

    // Fire-and-forget: dispatch webhook event
    dispatchWebhooks(userId, "meeting.created", { meeting }).catch(() => {});

    return NextResponse.json({ meeting }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("POST /api/meetings error:", err);
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId, scopes } = await resolveAuth(request);
    requireScope(scopes, "meetings:read");

    const { searchParams } = new URL(request.url);
    const tab = searchParams.get("status") || "all";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      Math.max(1, parseInt(searchParams.get("limit") || "50", 10)),
      100,
    );
    const offset = (page - 1) * limit;

    // Build status filter
    const filter = statusFilter(tab);

    // Get total count for pagination metadata
    const countResult = await d1Query<{ count: number }>(
      `SELECT COUNT(*) as count FROM meetings WHERE user_id = ? ${filter.clause}`,
      [userId, ...filter.params],
    );
    const total = countResult.results[0]?.count ?? 0;

    // Fetch the page of meetings
    const result = await d1Query<MeetingRow>(
      `SELECT * FROM meetings WHERE user_id = ? ${filter.clause} ORDER BY start_time DESC LIMIT ? OFFSET ?`,
      [userId, ...filter.params, limit, offset],
    );

    const meetings = result.results.map(formatMeeting);

    return NextResponse.json({ meetings, total, page, limit });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("GET /api/meetings error:", err);
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { userId, scopes } = await resolveAuth(request);
    requireScope(scopes, "meetings:write");

    const body = await request.json();
    const { id, status, canceledReason } = body;

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Missing meeting id" }, { status: 400 });
    }

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

    // Dispatch webhook for cancellation
    if (status === "canceled") {
      dispatchWebhooks(userId, "meeting.canceled", {
        meeting: { id, status, canceledReason },
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, id, status });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("PATCH /api/meetings error:", err);
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }
}
