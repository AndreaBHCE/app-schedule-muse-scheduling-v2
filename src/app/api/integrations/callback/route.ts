import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import crypto from "crypto";
import { d1Query } from "@/lib/cloudflare";

/**
 * Verify the HMAC-signed state and extract the Clerk userId.
 *
 * State format (produced by /api/integrations/connect):
 *   zoom-oauth.{userId}.{timestamp_base36}.{nonce}.{hmac_sha256_hex}
 *
 * Verification:
 *  1. Split on the last "." to separate payload from signature.
 *  2. Re-compute HMAC-SHA256(ZOOM_CLIENT_SECRET, payload).
 *  3. Timing-safe compare.
 *  4. Reject states older than 10 minutes (replay protection).
 *
 * Returns the userId on success, null on any failure. Fail closed.
 */
function verifyAndExtractState(state: string): string | null {
  const secret = process.env.ZOOM_CLIENT_SECRET;
  if (!secret) return null;

  const lastDot = state.lastIndexOf(".");
  if (lastDot === -1) return null;

  const payload = state.substring(0, lastDot);
  const signature = state.substring(lastDot + 1);

  // Recompute expected signature
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  // Timing-safe comparison
  if (expected.length !== signature.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature)))
    return null;

  // Parse payload: zoom-oauth.{userId}.{timestamp_b36}.{nonce}
  const parts = payload.split(".");
  if (parts.length !== 4 || parts[0] !== "zoom-oauth") return null;

  const userId = parts[1];
  const timestamp = parseInt(parts[2], 36);

  // Reject states older than 10 minutes
  const MAX_AGE_MS = 10 * 60 * 1000;
  if (Date.now() - timestamp > MAX_AGE_MS) return null;

  return userId || null;
}

// Zoom OAuth callback handler
// NOTE: This route is marked as public in middleware.ts because
// Zoom redirects the user here and Clerk session cookies may not
// be present on the redirect request.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    // Handle OAuth errors from Zoom
    if (error) {
      console.error("Zoom OAuth error:", error);
      return NextResponse.redirect(
        new URL("/integrations?error=zoom_oauth_failed", request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL("/integrations?error=missing_code", request.url)
      );
    }

    if (!state) {
      return NextResponse.redirect(
        new URL("/integrations?error=missing_state", request.url)
      );
    }

    // --- Resolve the authenticated user ---
    // Try Clerk auth() first (works if session cookie survived the redirect).
    // Fall back to the HMAC-verified state parameter.
    let userId: string | null = null;

    try {
      const clerkAuth = await auth();
      userId = clerkAuth.userId;
    } catch {
      // Expected during cross-origin redirect — fall through to state verification
    }

    if (!userId) {
      // Verify HMAC signature and extract userId from signed state
      userId = verifyAndExtractState(state);
    }

    if (!userId) {
      return NextResponse.redirect(
        new URL("/sign-in?redirect=/integrations", request.url)
      );
    }

    // --- Exchange code for tokens ---
    const tokenResponse = await exchangeCodeForToken(code);

    if (!tokenResponse.access_token) {
      return NextResponse.redirect(
        new URL("/integrations?error=token_exchange_failed", request.url)
      );
    }

    // --- Ensure user row exists (FK constraint) ---
    await ensureUserExists(userId);

    // --- Store the tokens ---
    await storeZoomTokens(userId, tokenResponse);

    // Redirect back to integrations page with success
    return NextResponse.redirect(
      new URL("/integrations?success=zoom_connected", request.url)
    );

  } catch (err) {
    console.error("Zoom OAuth callback failed:", err instanceof Error ? err.message : err);
    return NextResponse.redirect(
      new URL("/integrations?error=callback_failed", request.url)
    );
  }
}

// Exchange Zoom authorization code for access token
async function exchangeCodeForToken(code: string) {
  const zoomClientId = process.env.ZOOM_CLIENT_ID;
  const zoomClientSecret = process.env.ZOOM_CLIENT_SECRET;
  const redirectUri = 'https://app.schedulemuseai.com/api/integrations/callback';

  if (!zoomClientId || !zoomClientSecret) {
    throw new Error("Zoom credentials not configured — check ZOOM_CLIENT_ID and ZOOM_CLIENT_SECRET env vars");
  }

  const credentials = Buffer.from(`${zoomClientId}:${zoomClientSecret}`).toString('base64');

  const response = await fetch("https://zoom.us/oauth/token", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: code,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("Zoom token exchange failed:", response.status);
    throw new Error(`Zoom token exchange failed (${response.status})`);
  }

  return await response.json();
}

// Ensure the user row exists in D1 so the FK on integrations.user_id won't fail
async function ensureUserExists(userId: string) {
  await d1Query(
    `INSERT INTO users (id, created_at, updated_at)
     VALUES (?, datetime('now'), datetime('now'))
     ON CONFLICT(id) DO NOTHING`,
    [userId]
  );
}

// Store Zoom tokens in database
async function storeZoomTokens(userId: string, tokenData: any) {
  const id = `int-zoom-${Date.now()}-${Math.round(Math.random() * 100000)}`;

  const encryptedAccessToken = Buffer.from(tokenData.access_token).toString('base64');
  const encryptedRefreshToken = tokenData.refresh_token
    ? Buffer.from(tokenData.refresh_token).toString('base64')
    : '';

  const metadata = JSON.stringify({
    zoom_user_id: tokenData.id || '',
    account_id: tokenData.account_id || '',
    scope: tokenData.scope || '',
    token_type: tokenData.token_type || 'bearer',
  });

  await d1Query(
    `INSERT INTO integrations (id, user_id, provider, status, access_token, refresh_token, metadata, connected_at)
     VALUES (?, ?, 'zoom', 'connected', ?, ?, ?, datetime('now'))
     ON CONFLICT(user_id, provider) DO UPDATE SET
       status = 'connected',
       access_token = excluded.access_token,
       refresh_token = excluded.refresh_token,
       metadata = excluded.metadata,
       connected_at = datetime('now'),
       updated_at = datetime('now')`,
    [id, userId, encryptedAccessToken, encryptedRefreshToken, metadata]
  );
}