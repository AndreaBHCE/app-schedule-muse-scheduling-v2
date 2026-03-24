import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { d1Query } from "@/lib/cloudflare";
import { encryptToken } from "@/lib/crypto";
import crypto from "crypto";

/**
 * Verify & extract Clerk userId from an HMAC-signed state parameter.
 *
 * State format: zoom-oauth.{clerkUserId}.{timestamp_b36}.{nonce}.{hmac_hex}
 * The HMAC is computed over everything before the last dot using ZOOM_CLIENT_SECRET.
 */
function verifyState(state: string): string | null {
  const secret = process.env.ZOOM_CLIENT_SECRET;
  if (!secret) return null;

  const lastDot = state.lastIndexOf(".");
  if (lastDot === -1) return null;

  const payload = state.slice(0, lastDot);
  const receivedSig = state.slice(lastDot + 1);

  const expectedSig = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  // Constant-time comparison to prevent timing attacks
  if (
    receivedSig.length !== expectedSig.length ||
    !crypto.timingSafeEqual(
      Buffer.from(receivedSig, "hex"),
      Buffer.from(expectedSig, "hex"),
    )
  ) {
    return null;
  }

  // Parse payload: zoom-oauth.{userId}.{timestamp}.{nonce}
  const parts = payload.split(".");
  if (parts.length !== 4 || parts[0] !== "zoom-oauth") return null;

  // Reject states older than 10 minutes
  const timestamp = parseInt(parts[2], 36);
  if (Date.now() - timestamp > 10 * 60 * 1000) return null;

  return parts[1]; // userId
}

/**
 * Legacy fallback: extract userId from unsigned state.
 * Only used for states generated before the HMAC migration.
 */
function extractUserIdFromStateLegacy(state: string): string | null {
  const match = state.match(/^zoom-oauth-(user_[^-]+)-/);
  return match ? match[1] : null;
}

// Zoom OAuth callback handler
// NOTE: This route is marked as public in middleware.ts because
// Zoom redirects the user here and Clerk session cookies may not
// be present on the redirect request.
export async function GET(request: NextRequest) {
  console.log("🔄 Zoom OAuth callback triggered");
  console.log("Callback URL:", request.url);
  console.log("Environment check - ZOOM_CLIENT_ID:", process.env.ZOOM_CLIENT_ID ? "SET" : "NOT SET");
  console.log("Environment check - ZOOM_CLIENT_SECRET:", process.env.ZOOM_CLIENT_SECRET ? "SET" : "NOT SET");

  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    console.log("Callback params:", { code: code ? "PRESENT" : "MISSING", state: state ? "PRESENT" : "MISSING", error });

    // Handle OAuth errors from Zoom
    if (error) {
      console.error("Zoom OAuth error:", error);
      return NextResponse.redirect(
        new URL(`/integrations?error=zoom_oauth_failed&details=${encodeURIComponent(error)}`, request.url)
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
    // Fall back to the HMAC-verified userId embedded in the state parameter.
    let userId: string | null = null;

    try {
      const clerkAuth = await auth();
      userId = clerkAuth.userId;
      console.log("Clerk auth() resolved userId:", userId ? "PRESENT" : "NULL");
    } catch (authErr) {
      console.warn("Clerk auth() threw (expected during cross-origin redirect):", authErr instanceof Error ? authErr.message : authErr);
    }

    if (!userId) {
      // Verify HMAC signature before trusting the userId from state
      userId = verifyState(state);

      // Legacy fallback for pre-HMAC states (remove after migration window)
      if (!userId) {
        userId = extractUserIdFromStateLegacy(state);
        if (userId) {
          console.warn("OAuth callback used legacy unsigned state — client should be updated");
        }
      }

      console.log("Recovered userId from state param:", userId ? "PRESENT" : "NULL");
    }

    if (!userId) {
      console.error("No userId from auth() or state param — cannot complete OAuth");
      return NextResponse.redirect(
        new URL("/sign-in?redirect=/integrations", request.url)
      );
    }

    // --- Exchange code for tokens ---
    const tokenResponse = await exchangeCodeForToken(code);

    if (!tokenResponse.access_token) {
      return NextResponse.redirect(
        new URL("/integrations?error=token_exchange_failed&details=no_access_token_in_response", request.url)
      );
    }

    // --- Ensure user row exists (FK constraint) ---
    // Fetch the user's email & name from Clerk so the INSERT satisfies NOT NULL columns
    let email = "";
    let displayName = "";
    try {
      const clerkUser = await currentUser();
      email = clerkUser?.emailAddresses?.[0]?.emailAddress || "";
      displayName = [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ") || "";
    } catch (e) {
      console.warn("Could not fetch Clerk user profile for DB upsert:", e);
    }
    await ensureUserExists(userId, email, displayName);

    // --- Store the tokens ---
    await storeZoomTokens(userId, tokenResponse);

    // Redirect back to integrations page with success
    return NextResponse.redirect(
      new URL("/integrations?success=zoom_connected", request.url)
    );

  } catch (err) {
    console.error("Zoom OAuth callback error:", err);
    console.error("Error details:", {
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      url: request.url,
      searchParams: Object.fromEntries(new URL(request.url).searchParams)
    });

    const errorMessage = err instanceof Error ? err.message : String(err);
    const encodedError = encodeURIComponent(errorMessage.substring(0, 200));

    return NextResponse.redirect(
      new URL(`/integrations?error=callback_error&details=${encodedError}`, request.url)
    );
  }
}

// Exchange Zoom authorization code for access token
async function exchangeCodeForToken(code: string) {
  const zoomClientId = process.env.ZOOM_CLIENT_ID;
  const zoomClientSecret = process.env.ZOOM_CLIENT_SECRET;
  const redirectUri =
    process.env.ZOOM_REDIRECT_URI ||
    "https://app.schedulemuseai.com/api/integrations/callback";

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
    console.error("Zoom token exchange failed:", response.status, errorBody);
    // Include the Zoom error body so it surfaces in the redirect
    throw new Error(`Zoom token exchange ${response.status}: ${errorBody.substring(0, 150)}`);
  }

  return await response.json();
}

// Ensure the user row exists in D1 so the FK on integrations.user_id won't fail.
// The users table requires `email NOT NULL`, so we must supply it on INSERT.
async function ensureUserExists(userId: string, email: string, displayName: string) {
  await d1Query(
    `INSERT INTO users (id, email, display_name, created_at, updated_at)
     VALUES (?, ?, ?, datetime('now'), datetime('now'))
     ON CONFLICT(id) DO UPDATE SET
       email = CASE WHEN users.email = '' THEN excluded.email ELSE users.email END,
       display_name = CASE WHEN users.display_name = '' THEN excluded.display_name ELSE users.display_name END,
       updated_at = datetime('now')`,
    [userId, email || "unknown@placeholder", displayName]
  );
}

// Store Zoom tokens in database
async function storeZoomTokens(userId: string, tokenData: any) {
  const id = `int-zoom-${Date.now()}-${Math.round(Math.random() * 100000)}`;

  const encryptedAccessToken = encryptToken(tokenData.access_token);
  const encryptedRefreshToken = tokenData.refresh_token
    ? encryptToken(tokenData.refresh_token)
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