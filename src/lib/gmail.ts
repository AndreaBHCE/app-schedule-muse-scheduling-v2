import { d1Query } from "./cloudflare";
import { encryptToken, decryptToken } from "./crypto";

/**
 * Gmail integration — Google OAuth 2.0 + Gmail API.
 *
 * Mirrors the pattern in zoom.ts:
 *   getGmailTokens  → read encrypted tokens from D1
 *   refreshGmailToken → refresh via Google token endpoint
 *   gmailApiRequest   → authenticated fetch with auto-refresh
 *   sendGmailEmail    → send an email via Gmail API (RFC 2822 MIME)
 *
 * Required env vars:
 *   GMAIL_CLIENT_ID
 *   GMAIL_CLIENT_SECRET
 *   GMAIL_REDIRECT_URI  (default: https://app.app.schedulemuseai.com/api/integrations/callback)
 */

const GMAIL_API_BASE = "https://gmail.googleapis.com/gmail/v1";

/* ── Types ───────────────────────────────────────────────── */

export interface GmailTokens {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
}

/* ── Token helpers ───────────────────────────────────────── */

/** Read the encrypted Gmail tokens from the integrations table. */
export async function getGmailTokens(userId: string): Promise<GmailTokens | null> {
  const result = await d1Query(
    `SELECT access_token, refresh_token, metadata FROM integrations
     WHERE user_id = ? AND provider = 'gmail' AND status = 'connected'`,
    [userId],
  );

  if (!result.results || result.results.length === 0) return null;

  const row = result.results[0];
  const accessToken = row.access_token ? decryptToken(String(row.access_token)) : "";
  const refreshToken = row.refresh_token ? decryptToken(String(row.refresh_token)) : "";

  return { access_token: accessToken, refresh_token: refreshToken };
}

/** Use the refresh_token to obtain a fresh access_token from Google. */
export async function refreshGmailToken(userId: string): Promise<GmailTokens | null> {
  const tokens = await getGmailTokens(userId);
  if (!tokens?.refresh_token) return null;

  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Gmail credentials not configured — check GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET env vars");
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
      console.error("Gmail token refresh failed:", response.status);
      return null;
    }

    const newTokens: GmailTokens = await response.json();

    // Google may or may not return a new refresh_token — keep the old one if absent
    const encryptedAccess = encryptToken(newTokens.access_token);
    const encryptedRefresh = newTokens.refresh_token
      ? encryptToken(newTokens.refresh_token)
      : encryptToken(tokens.refresh_token);

    await d1Query(
      `UPDATE integrations SET
       access_token = ?,
       refresh_token = ?,
       updated_at = datetime('now')
       WHERE user_id = ? AND provider = 'gmail'`,
      [encryptedAccess, encryptedRefresh, userId],
    );

    return {
      ...newTokens,
      refresh_token: newTokens.refresh_token || tokens.refresh_token,
    };
  } catch (error) {
    console.error("Gmail token refresh error:", error);
    return null;
  }
}

/* ── Authenticated API request ───────────────────────────── */

/** Make an authenticated Gmail API request, retrying once on 401. */
export async function gmailApiRequest(
  userId: string,
  endpoint: string,
  options: RequestInit = {},
): Promise<Response> {
  let tokens = await getGmailTokens(userId);
  if (!tokens) throw new Error("No Gmail tokens found for user");

  const makeRequest = (accessToken: string) =>
    fetch(`${GMAIL_API_BASE}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

  let response = await makeRequest(tokens.access_token);

  if (response.status === 401) {
    console.log("Gmail token expired, attempting refresh…");
    const newTokens = await refreshGmailToken(userId);
    if (newTokens) {
      response = await makeRequest(newTokens.access_token);
    }
  }

  return response;
}

/* ── Send email ──────────────────────────────────────────── */

/**
 * Send an email through the authenticated user's Gmail account.
 * Uses the `users.messages.send` endpoint with a raw RFC 2822 message.
 */
export async function sendGmailEmail(
  userId: string,
  to: string,
  subject: string,
  htmlBody: string,
  fromName?: string,
): Promise<{ sent: boolean; error?: string }> {
  try {
    // Build RFC 2822 MIME message
    const fromHeader = fromName ? `"${fromName}" <me>` : "me";
    const raw = [
      `From: ${fromHeader}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset="UTF-8"`,
      ``,
      htmlBody,
    ].join("\r\n");

    // Base64url encode (Gmail API requirement)
    const encoded = Buffer.from(raw)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const response = await gmailApiRequest(userId, "/users/me/messages/send", {
      method: "POST",
      body: JSON.stringify({ raw: encoded }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Gmail send failed:", response.status, errorBody);
      return { sent: false, error: `Gmail API error (${response.status})` };
    }

    return { sent: true };
  } catch (error) {
    console.error("Gmail send error:", error);
    return { sent: false, error: (error as Error).message };
  }
}

/* ── User profile ────────────────────────────────────────── */

/** Get the Gmail user's profile (email address, messages total, etc.). */
export async function getGmailProfile(userId: string) {
  try {
    const response = await gmailApiRequest(userId, "/users/me/profile");
    if (!response.ok) {
      console.error("Failed to get Gmail profile:", response.status);
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error("Gmail profile error:", error);
    return null;
  }
}
