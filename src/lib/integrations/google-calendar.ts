import { d1Query } from "../cloudflare";
import { encryptToken, decryptToken } from "../crypto";

/**
 * Google Calendar + Meet integration — Google OAuth 2.0 + Calendar API.
 *
 * Google Meet links are created via the Calendar API (conferenceData).
 * Both google_calendar and google_meet integrations share the same tokens
 * and OAuth credentials (GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET).
 *
 * Provider key in D1: "google_calendar" (single row covers both features).
 */

const CALENDAR_API_BASE = "https://www.googleapis.com/calendar/v3";

/* ── Types ───────────────────────────────────────────────── */

export interface GoogleCalendarTokens {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
}

export interface CalendarEvent {
  id: string;
  htmlLink: string;
  hangoutLink?: string;
  summary: string;
  start: { dateTime: string };
  end: { dateTime: string };
}

/* ── Token helpers ───────────────────────────────────────── */

/** Read encrypted tokens from the integrations table. */
export async function getGoogleCalendarTokens(
  userId: string,
  provider: "google_calendar" | "google_meet" = "google_calendar",
): Promise<GoogleCalendarTokens | null> {
  const result = await d1Query(
    `SELECT access_token, refresh_token, metadata FROM integrations
     WHERE user_id = ? AND provider = ? AND status = 'connected'`,
    [userId, provider],
  );

  if (!result.results || result.results.length === 0) return null;

  const row = result.results[0];
  const accessToken = row.access_token
    ? decryptToken(String(row.access_token))
    : "";
  const refreshToken = row.refresh_token
    ? decryptToken(String(row.refresh_token))
    : "";

  return { access_token: accessToken, refresh_token: refreshToken };
}

/** Use the refresh_token to obtain a fresh access_token from Google. */
export async function refreshGoogleCalendarToken(
  userId: string,
  provider: "google_calendar" | "google_meet" = "google_calendar",
): Promise<GoogleCalendarTokens | null> {
  const tokens = await getGoogleCalendarTokens(userId, provider);
  if (!tokens?.refresh_token) return null;

  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "Google Calendar credentials not configured — check GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET env vars",
    );
  }

  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: tokens.refresh_token,
        grant_type: "refresh_token",
      }),
    });

    if (!response.ok) {
      console.error("Google Calendar token refresh failed:", response.status);
      return null;
    }

    const newTokens: GoogleCalendarTokens = await response.json();

    const encryptedAccess = encryptToken(newTokens.access_token);
    const encryptedRefresh = newTokens.refresh_token
      ? encryptToken(newTokens.refresh_token)
      : encryptToken(tokens.refresh_token);

    await d1Query(
      `UPDATE integrations SET
       access_token = ?,
       refresh_token = ?,
       updated_at = datetime('now')
       WHERE user_id = ? AND provider = ?`,
      [encryptedAccess, encryptedRefresh, userId, provider],
    );

    return {
      ...newTokens,
      refresh_token: newTokens.refresh_token || tokens.refresh_token,
    };
  } catch (error) {
    console.error("Google Calendar token refresh error:", error);
    return null;
  }
}

/* ── Authenticated API request ───────────────────────────── */

/** Make an authenticated Calendar API request, retrying once on 401. */
export async function calendarApiRequest(
  userId: string,
  endpoint: string,
  options: RequestInit = {},
  provider: "google_calendar" | "google_meet" = "google_calendar",
): Promise<Response> {
  let tokens = await getGoogleCalendarTokens(userId, provider);
  if (!tokens) throw new Error(`No ${provider} tokens found for user`);

  const makeRequest = (accessToken: string) =>
    fetch(`${CALENDAR_API_BASE}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

  let response = await makeRequest(tokens.access_token);

  if (response.status === 401) {
    console.log(`${provider} token expired, attempting refresh…`);
    const newTokens = await refreshGoogleCalendarToken(userId, provider);
    if (newTokens) {
      response = await makeRequest(newTokens.access_token);
    }
  }

  return response;
}

/* ── Create Calendar Event (with optional Meet link) ─────── */

/**
 * Create a Google Calendar event, optionally with a Google Meet link.
 *
 * @param includeMeet  If true, attaches conferenceData to generate a Meet link.
 */
export async function createCalendarEvent(
  userId: string,
  opts: {
    summary: string;
    description?: string;
    startTime: string; // ISO 8601
    endTime: string;   // ISO 8601
    timezone?: string;
    attendeeEmail?: string;
    includeMeet?: boolean;
  },
  provider: "google_calendar" | "google_meet" = "google_calendar",
): Promise<CalendarEvent | null> {
  try {
    const event: Record<string, unknown> = {
      summary: opts.summary,
      description: opts.description || "",
      start: { dateTime: opts.startTime, timeZone: opts.timezone || "UTC" },
      end: { dateTime: opts.endTime, timeZone: opts.timezone || "UTC" },
    };

    if (opts.attendeeEmail) {
      event.attendees = [{ email: opts.attendeeEmail }];
    }

    if (opts.includeMeet) {
      event.conferenceData = {
        createRequest: {
          requestId: `smai-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      };
    }

    const conferenceParam = opts.includeMeet ? "?conferenceDataVersion=1" : "";
    const response = await calendarApiRequest(
      userId,
      `/calendars/primary/events${conferenceParam}`,
      {
        method: "POST",
        body: JSON.stringify(event),
      },
      provider,
    );

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Calendar event creation failed:", response.status, errorBody);
      return null;
    }

    const created = await response.json();
    return {
      id: created.id,
      htmlLink: created.htmlLink,
      hangoutLink: created.hangoutLink || undefined,
      summary: created.summary,
      start: created.start,
      end: created.end,
    };
  } catch (error) {
    console.error("Calendar event creation error:", error);
    return null;
  }
}

/**
 * Convenience: create a Google Meet link only (creates a calendar event with Meet attached).
 * Returns the Meet join URL or null.
 */
export async function createGoogleMeetLink(
  userId: string,
  opts: {
    summary: string;
    description?: string;
    startTime: string;
    endTime: string;
    timezone?: string;
    attendeeEmail?: string;
  },
): Promise<string | null> {
  const event = await createCalendarEvent(userId, {
    ...opts,
    includeMeet: true,
  }, "google_meet");
  return event?.hangoutLink || null;
}
