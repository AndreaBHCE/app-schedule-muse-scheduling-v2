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
    const duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));

    if (duration <= 0) {
      return NextResponse.json({ error: "End time must be after start time" }, { status: 400 });
    }

    // Check if user has Zoom integration
    const zoomIntegration = await d1Query(
      `SELECT id FROM integrations WHERE user_id = ? AND provider = 'zoom' AND status = 'connected'`,
      [userId]
    );

    let zoomMeeting = null;
    let locationDetails = data.location_details || '';

    // Create Zoom meeting if integration exists
    if (zoomIntegration.results && zoomIntegration.results.length > 0) {
      const meetingTopic = `${data.guest_name} - ${data.meeting_type || 'Meeting'}`;
      const zoomStartTime = startTime.toISOString();

      zoomMeeting = await createZoomMeeting(userId, {
        topic: meetingTopic,
        start_time: zoomStartTime,
        duration: duration,
        timezone: "UTC", // You might want to get user's timezone
        agenda: data.notes || "",
      });

      if (zoomMeeting) {
        locationDetails = zoomMeeting.join_url;
      }
    }

    // Create meeting record in database
    const meetingId = `meeting-${Date.now()}-${Math.round(Math.random() * 100000)}`;

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
        data.meeting_type || '',
        data.start_time,
        data.end_time,
        data.location || 'virtual',
        locationDetails,
        data.notes || '',
      ]
    );

    const meeting = {
      id: meetingId,
      guest_name: data.guest_name,
      guest_email: data.guest_email,
      start_time: data.start_time,
      end_time: data.end_time,
      location: data.location || 'virtual',
      location_details: locationDetails,
      zoom_meeting: zoomMeeting,
      created: true,
    };

    // Fire-and-forget: dispatch webhook event
    dispatchWebhooks(userId, "meeting.created", { meeting }).catch(() => {});

    return NextResponse.json({ meeting }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("POST /api/meetings error:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId, scopes } = await resolveAuth(request);
    requireScope(scopes, "meetings:read");
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");

    const result = await d1Query(
      `SELECT * FROM meetings WHERE user_id = ? ORDER BY start_time DESC LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );

    const meetings = result.results.map((row: any) => ({
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
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return NextResponse.json({ meetings });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("GET /api/meetings error:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}