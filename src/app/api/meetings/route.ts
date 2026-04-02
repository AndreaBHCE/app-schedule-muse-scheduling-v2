import { NextRequest, NextResponse } from "next/server";
import { resolveAuth, AuthError } from "@/lib/auth";
import { requireScope } from "@/lib/apikey";
import { d1Query } from "@/lib/cloudflare";
import { createZoomMeeting } from "@/lib/integrations/zoom";
import { createCalendarEvent, createGoogleMeetLink } from "@/lib/integrations/google-calendar";
import { dispatchWebhooks } from "@/lib/webhooks";
import { waitUntil } from "@vercel/functions";
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
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  company?: string;
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

/**
 * Build a SQL WHERE clause fragment for the status filter tabs.
 *
 * - "upcoming":  confirmed or pending, start_time in the future
 * - "past":      completed, or start_time in the past (regardless of status)
 * - "canceled":  status = 'canceled' or 'no-show'
 * - "all":       no extra filter
 */

async function ensureMeetingsAttendeeEmailColumn(): Promise<void> {
  const result = await d1Query<{name: string}>(`PRAGMA table_info(meetings)`);
  const columnExists = result.results.some((row) => row.name === "attendee_email");
  if (!columnExists) {
    // Schema migration: add the required column if missing.
    await d1Query(`ALTER TABLE meetings ADD COLUMN attendee_email TEXT`);
  }
}

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
    await ensureMeetingsAttendeeEmailColumn();
    const data: MeetingData = await request.json();

    // Validate required fields with proper format checks
    const err = firstError(
      requiredString("first_name", data.first_name),
      requiredString("last_name", data.last_name),
      validEmail("email", data.email),
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
      const meetingTopic = `${data.first_name} ${data.last_name} - ${data.meeting_type || "Meeting"}`;
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

    // --- Google Meet: create Meet link via Calendar API ---
    let googleMeetLink: string | null = null;
    let calendarEventCreated = false;

    if (!zoomMeeting && data.location === "google_meet") {
      const meetIntegration = await d1Query(
        `SELECT id FROM integrations WHERE user_id = ? AND provider = 'google_meet' AND status = 'connected'`,
        [userId],
      );

      if (meetIntegration.results && meetIntegration.results.length > 0) {
        const meetingSummary = `${data.first_name} ${data.last_name} - ${data.meeting_type || "Meeting"}`;
        googleMeetLink = await createGoogleMeetLink(userId, {
          summary: meetingSummary,
          description: data.notes || "",
          startTime: data.start_time,
          endTime: data.end_time,
          attendeeEmail: data.email,
        });

        if (googleMeetLink) {
          locationDetails = googleMeetLink;
          calendarEventCreated = true; // Event was created as part of Meet link
        }
      }
    }

    // --- Google Calendar: sync event if integration connected and not already created ---
    if (!calendarEventCreated) {
      const calIntegration = await d1Query(
        `SELECT id FROM integrations WHERE user_id = ? AND provider = 'google_calendar' AND status = 'connected'`,
        [userId],
      );

      if (calIntegration.results && calIntegration.results.length > 0) {
        const meetingSummary = `${data.first_name} ${data.last_name} - ${data.meeting_type || "Meeting"}`;
        await createCalendarEvent(userId, {
          summary: meetingSummary,
          description: data.notes || "",
          startTime: data.start_time,
          endTime: data.end_time,
          attendeeEmail: data.email,
          includeMeet: false,
        });
        // Non-critical — we don't fail the meeting creation if calendar sync fails
      }
    }

    // Create meeting record in database
    const meetingId = `meeting-${crypto.randomUUID()}`;

    await d1Query(
      `INSERT INTO meetings (
        id, user_id, booking_page_id, attendee_email, meeting_type,
        start_time, end_time, status, location_type, location_details, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmed', ?, ?, ?)`,
      [
        meetingId,
        userId,
        data.booking_page_id || null,
        data.email,
        data.meeting_type || "",
        data.start_time,
        data.end_time,
        data.location || "virtual",
        locationDetails,
        data.notes || "",
      ],
    );

    // Auto-upsert attendee into contacts — every meeting path gets this for free
    const contactId = `contact-${crypto.randomUUID()}`;

    await d1Query(
      `INSERT INTO contacts (id, user_id, first_name, last_name, email, phone, company, total_meetings, last_meeting_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
       ON CONFLICT(user_id, email) DO UPDATE SET
         first_name = CASE WHEN excluded.first_name != '' THEN excluded.first_name ELSE contacts.first_name END,
         last_name  = CASE WHEN excluded.last_name  != '' THEN excluded.last_name  ELSE contacts.last_name  END,
         phone      = CASE WHEN excluded.phone      != '' THEN excluded.phone      ELSE contacts.phone      END,
         company    = CASE WHEN excluded.company    != '' THEN excluded.company    ELSE contacts.company    END,
         total_meetings = contacts.total_meetings + 1,
         last_meeting_at = excluded.last_meeting_at,
         updated_at = datetime('now')`,
      [contactId, userId, data.first_name, data.last_name, data.email, data.phone || "", data.company || "", data.start_time],
    );

    const meeting = {
      id: meetingId,
      attendee_email: data.email,
      start_time: data.start_time,
      end_time: data.end_time,
      location: data.location || "virtual",
      location_details: locationDetails,
      zoom_meeting: zoomMeeting,
      google_meet_link: googleMeetLink,
      created: true,
    };

    // Dispatch webhook event (runs after response via waitUntil)
    waitUntil(dispatchWebhooks(userId, "meeting.created", { meeting }));

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

    // Fetch the page of meetings, JOIN contacts for attendee identity
    const result = await d1Query<MeetingRow>(
      `SELECT m.*, c.first_name, c.last_name, c.phone, c.company
       FROM meetings m
       LEFT JOIN contacts c ON c.email = m.attendee_email AND c.user_id = m.user_id
       WHERE m.user_id = ? ${filter.clause}
       ORDER BY m.start_time DESC LIMIT ? OFFSET ?`,
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
