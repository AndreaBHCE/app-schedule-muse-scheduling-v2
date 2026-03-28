import { d1Query } from "../cloudflare";
import { encryptToken, decryptToken } from "../crypto";

// GoTo Meeting API configuration
const GOTO_API_BASE = "https://api.getgo.com/G2M/rest/v1";

export interface GoToTokens {
  access_token: string;
  refresh_token?: string;
  organizer_key?: string;
}

export interface GoToMeeting {
  meetingId: string;
  subject: string;
  startTime: string;
  endTime: string;
  joinUrl: string;
  conferenceCallInfo?: string;
}

// Get GoTo tokens for a user
export async function getGoToTokens(userId: string): Promise<GoToTokens | null> {
  const result = await d1Query(
    `SELECT access_token, refresh_token, metadata FROM integrations
     WHERE user_id = ? AND provider = 'goto' AND status = 'connected'`,
    [userId],
  );

  if (!result.results || result.results.length === 0) {
    return null;
  }

  const row = result.results[0];
  const accessToken = row.access_token ? decryptToken(String(row.access_token)) : "";
  const refreshToken = row.refresh_token ? decryptToken(String(row.refresh_token)) : "";

  let organizerKey = "";
  try {
    const meta = JSON.parse(String(row.metadata || "{}"));
    organizerKey = meta.organizer_key || "";
  } catch {
    // Malformed metadata — proceed without organizer_key
  }

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    organizer_key: organizerKey,
  };
}

// Refresh GoTo access token
export async function refreshGoToToken(userId: string): Promise<GoToTokens | null> {
  const tokens = await getGoToTokens(userId);
  if (!tokens?.refresh_token) {
    return null;
  }

  const clientId = process.env.GOTOMEETING_CLIENT_ID;
  const clientSecret = process.env.GOTOMEETING_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("GoTo Meeting credentials not configured — set GOTOMEETING_CLIENT_ID and GOTOMEETING_SECRET");
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  try {
    const response = await fetch("https://authentication.logmeininc.com/oauth/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: tokens.refresh_token,
      }),
    });

    if (!response.ok) {
      console.error("GoTo token refresh failed:", response.status);
      return null;
    }

    const newTokens = await response.json();

    // Update tokens in database
    const encryptedAccessToken = encryptToken(newTokens.access_token);
    const encryptedRefreshToken = newTokens.refresh_token
      ? encryptToken(newTokens.refresh_token)
      : encryptToken(tokens.refresh_token); // Re-encrypt existing if not rotated

    await d1Query(
      `UPDATE integrations SET
       access_token = ?,
       refresh_token = ?,
       updated_at = datetime('now')
       WHERE user_id = ? AND provider = 'goto'`,
      [encryptedAccessToken, encryptedRefreshToken, userId],
    );

    return {
      access_token: newTokens.access_token,
      refresh_token: newTokens.refresh_token || tokens.refresh_token,
      organizer_key: tokens.organizer_key,
    };
  } catch (error) {
    console.error("GoTo token refresh error:", error);
    return null;
  }
}

// Make authenticated GoTo API request with automatic token refresh
export async function goToApiRequest(
  userId: string,
  endpoint: string,
  options: RequestInit = {},
): Promise<Response> {
  let tokens = await getGoToTokens(userId);
  if (!tokens) {
    throw new Error("No GoTo Meeting tokens found for user");
  }

  const makeRequest = (accessToken: string) => {
    return fetch(`${GOTO_API_BASE}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
  };

  let response = await makeRequest(tokens.access_token);

  // If token is expired, try to refresh and retry once
  if (response.status === 401) {
    console.log("GoTo token expired, attempting refresh...");
    const newTokens = await refreshGoToToken(userId);

    if (newTokens) {
      response = await makeRequest(newTokens.access_token);
    }
  }

  return response;
}

// Create a GoTo Meeting
export async function createGoToMeeting(
  userId: string,
  meetingData: {
    subject: string;
    startTime: string;
    endTime: string;
    passwordRequired?: boolean;
    conferencecallinfo?: string;
  },
): Promise<GoToMeeting | null> {
  try {
    const payload = {
      subject: meetingData.subject,
      starttime: meetingData.startTime, // ISO 8601 format
      endtime: meetingData.endTime,     // ISO 8601 format
      passwordrequired: meetingData.passwordRequired ?? false,
      conferencecallinfo: meetingData.conferencecallinfo || "Hybrid",
      meetingtype: "scheduled",
    };

    const response = await goToApiRequest(userId, "/meetings", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("GoTo meeting creation failed:", error);
      return null;
    }

    // GoTo returns an array with the created meeting(s)
    const result = await response.json();
    const meeting = Array.isArray(result) ? result[0] : result;

    if (!meeting?.joinURL && !meeting?.joinUrl) {
      console.error("GoTo meeting response missing joinURL:", meeting);
      return null;
    }

    return {
      meetingId: String(meeting.meetingId || meeting.meetingid || ""),
      subject: meetingData.subject,
      startTime: meetingData.startTime,
      endTime: meetingData.endTime,
      joinUrl: meeting.joinURL || meeting.joinUrl || "",
      conferenceCallInfo: meeting.conferenceCallInfo || "",
    };
  } catch (error) {
    console.error("GoTo meeting creation error:", error);
    return null;
  }
}

// Get GoTo user/organizer info
export async function getGoToUser(userId: string) {
  try {
    const tokens = await getGoToTokens(userId);
    if (!tokens) return null;

    // The /me endpoint is on the admin API, not G2M
    const response = await fetch("https://api.getgo.com/admin/rest/v1/me", {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error("Failed to get GoTo user info:", response.status);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("GoTo user info error:", error);
    return null;
  }
}
