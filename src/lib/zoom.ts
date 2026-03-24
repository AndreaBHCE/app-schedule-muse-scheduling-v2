import { d1Query } from "./cloudflare";
import { encryptToken, decryptToken } from "./crypto";

// Zoom API configuration
const ZOOM_BASE_URL = "https://api.zoom.us/v2";

export interface ZoomTokens {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
}

export interface ZoomMeeting {
  id: string;
  topic: string;
  start_time: string;
  duration: number;
  timezone: string;
  join_url: string;
  start_url: string;
  password?: string;
}

// Get Zoom tokens for a user
export async function getZoomTokens(userId: string): Promise<ZoomTokens | null> {
  const result = await d1Query(
    `SELECT access_token, refresh_token, metadata FROM integrations
     WHERE user_id = ? AND provider = 'zoom' AND status = 'connected'`,
    [userId]
  );

  if (!result.results || result.results.length === 0) {
    return null;
  }

  const row = result.results[0];
  const accessToken = row.access_token ? decryptToken(String(row.access_token)) : '';
  const refreshToken = row.refresh_token ? decryptToken(String(row.refresh_token)) : '';

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
  };
}

// Refresh Zoom access token
export async function refreshZoomToken(userId: string): Promise<ZoomTokens | null> {
  const tokens = await getZoomTokens(userId);
  if (!tokens?.refresh_token) {
    return null;
  }

  const zoomClientId = process.env.ZOOM_CLIENT_ID;
  const zoomClientSecret = process.env.ZOOM_CLIENT_SECRET;

  if (!zoomClientId || !zoomClientSecret) {
    throw new Error("Zoom credentials not configured");
  }

  const credentials = Buffer.from(`${zoomClientId}:${zoomClientSecret}`).toString('base64');

  try {
    const response = await fetch("https://zoom.us/oauth/token", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: tokens.refresh_token,
      }),
    });

    if (!response.ok) {
      console.error("Zoom token refresh failed:", response.status);
      return null;
    }

    const newTokens = await response.json();

    // Update tokens in database
    const encryptedAccessToken = encryptToken(newTokens.access_token);
    const encryptedRefreshToken = newTokens.refresh_token
      ? encryptToken(newTokens.refresh_token)
      : encryptToken(tokens.refresh_token); // Re-encrypt existing token for storage

    await d1Query(
      `UPDATE integrations SET
       access_token = ?,
       refresh_token = ?,
       updated_at = datetime('now')
       WHERE user_id = ? AND provider = 'zoom'`,
      [encryptedAccessToken, encryptedRefreshToken, userId]
    );

    return newTokens;
  } catch (error) {
    console.error("Zoom token refresh error:", error);
    return null;
  }
}

// Make authenticated Zoom API request with automatic token refresh
export async function zoomApiRequest(
  userId: string,
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  let tokens = await getZoomTokens(userId);
  if (!tokens) {
    throw new Error("No Zoom tokens found for user");
  }

  const makeRequest = (accessToken: string) => {
    return fetch(`${ZOOM_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
  };

  let response = await makeRequest(tokens.access_token);

  // If token is expired, try to refresh and retry once
  if (response.status === 401) {
    console.log("Zoom token expired, attempting refresh...");
    const newTokens = await refreshZoomToken(userId);

    if (newTokens) {
      response = await makeRequest(newTokens.access_token);
    }
  }

  return response;
}

// Create a Zoom meeting
export async function createZoomMeeting(
  userId: string,
  meetingData: {
    topic: string;
    start_time: string;
    duration: number;
    timezone?: string;
    agenda?: string;
  }
): Promise<ZoomMeeting | null> {
  try {
    const payload = {
      topic: meetingData.topic,
      type: 2, // Scheduled meeting
      start_time: meetingData.start_time,
      duration: meetingData.duration,
      timezone: meetingData.timezone || "UTC",
      agenda: meetingData.agenda || "",
      settings: {
        host_video: true,
        participant_video: true,
        join_before_host: false,
        mute_upon_entry: true,
        watermark: false,
        use_pmi: false,
        approval_type: 0, // Automatically approve
        audio: "both", // Both telephone and computer audio
        auto_recording: "none",
      },
    };

    const response = await zoomApiRequest(userId, "/users/me/meetings", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Zoom meeting creation failed:", error);
      return null;
    }

    const meeting = await response.json();
    return {
      id: meeting.id.toString(),
      topic: meeting.topic,
      start_time: meeting.start_time,
      duration: meeting.duration,
      timezone: meeting.timezone,
      join_url: meeting.join_url,
      start_url: meeting.start_url,
      password: meeting.password,
    };
  } catch (error) {
    console.error("Zoom meeting creation error:", error);
    return null;
  }
}

// Get Zoom user info
export async function getZoomUser(userId: string) {
  try {
    const response = await zoomApiRequest(userId, "/users/me");

    if (!response.ok) {
      console.error("Failed to get Zoom user info:", response.status);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Zoom user info error:", error);
    return null;
  }
}