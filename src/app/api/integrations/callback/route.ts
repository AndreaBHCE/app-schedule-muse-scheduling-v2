import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import crypto from "crypto";
import { d1Query } from "@/lib/cloudflare";
import { encryptToken } from "@/lib/crypto";

/* ── State verification ──────────────────────────────────── */

/**
 * Generic HMAC state verifier.
 *
 * State format: {prefix}.{userId}.{timestamp_b36}.{nonce}.{hmac_hex}
 *
 * Returns { prefix, userId } on success, null on failure. Fail closed.
 */
function verifyState(
  state: string,
  secret: string,
  expectedPrefix: string,
): string | null {
  const lastDot = state.lastIndexOf(".");
  if (lastDot === -1) return null;

  const payload = state.substring(0, lastDot);
  const signature = state.substring(lastDot + 1);

  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  if (expected.length !== signature.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature)))
    return null;

  const parts = payload.split(".");
  if (parts.length !== 4 || parts[0] !== expectedPrefix) return null;

  const userId = parts[1];
  const timestamp = parseInt(parts[2], 36);

  // Reject states older than 10 minutes
  const MAX_AGE_MS = 10 * 60 * 1000;
  if (Date.now() - timestamp > MAX_AGE_MS) return null;

  return userId || null;
}

/** Detect provider from the state prefix. */
function detectProvider(state: string): "zoom" | "gmail" | null {
  if (state.startsWith("zoom-oauth.")) return "zoom";
  if (state.startsWith("gmail-oauth.")) return "gmail";
  return null;
}

/* ── Shared helpers ──────────────────────────────────────── */

async function ensureUserExists(userId: string) {
  await d1Query(
    `INSERT INTO users (id, created_at, updated_at)
     VALUES (?, datetime('now'), datetime('now'))
     ON CONFLICT(id) DO NOTHING`,
    [userId],
  );
}

/* ── Zoom-specific ───────────────────────────────────────── */

async function exchangeZoomCode(code: string) {
  const zoomClientId = process.env.ZOOM_CLIENT_ID;
  const zoomClientSecret = process.env.ZOOM_CLIENT_SECRET;
  const redirectUri = process.env.ZOOM_REDIRECT_URI || "https://app.schedulemuseai.com/api/integrations/callback";

  if (!zoomClientId || !zoomClientSecret) {
    throw new Error("Zoom credentials not configured");
  }

  const credentials = Buffer.from(`${zoomClientId}:${zoomClientSecret}`).toString("base64");

  const response = await fetch("https://zoom.us/oauth/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("Zoom token exchange failed:", response.status, errorBody);
    throw new Error(`Zoom token exchange failed (${response.status})`);
  }

  return await response.json();
}

async function storeZoomTokens(userId: string, tokenData: Record<string, unknown>) {
  const id = `int-zoom-${Date.now()}-${Math.round(Math.random() * 100000)}`;

  const encryptedAccess = encryptToken(String(tokenData.access_token));
  const encryptedRefresh = tokenData.refresh_token
    ? encryptToken(String(tokenData.refresh_token))
    : "";

  const metadata = JSON.stringify({
    zoom_user_id: tokenData.id || "",
    account_id: tokenData.account_id || "",
    scope: tokenData.scope || "",
    token_type: tokenData.token_type || "bearer",
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
    [id, userId, encryptedAccess, encryptedRefresh, metadata],
  );
}

/* ── Gmail-specific ──────────────────────────────────────── */

async function exchangeGmailCode(code: string) {
  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const redirectUri =
    process.env.GMAIL_REDIRECT_URI ||
    "https://app.schedulemuseai.com/api/integrations/callback";

  if (!clientId || !clientSecret) {
    throw new Error("Gmail credentials not configured");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("Gmail token exchange failed:", response.status, errorBody);
    throw new Error(`Gmail token exchange failed (${response.status})`);
  }

  return await response.json();
}

/** Fetch the user's Gmail address using the userinfo endpoint. */
async function fetchGmailEmail(accessToken: string): Promise<string> {
  try {
    const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (res.ok) {
      const info = await res.json();
      return info.email || "";
    }
  } catch {
    // Non-critical — store empty string
  }
  return "";
}

async function storeGmailTokens(userId: string, tokenData: Record<string, unknown>) {
  const id = `int-gmail-${Date.now()}-${Math.round(Math.random() * 100000)}`;

  const encryptedAccess = encryptToken(String(tokenData.access_token));
  const encryptedRefresh = tokenData.refresh_token
    ? encryptToken(String(tokenData.refresh_token))
    : "";

  // Fetch the Gmail address so we can display it in the UI
  const gmailAddress = await fetchGmailEmail(String(tokenData.access_token));

  const metadata = JSON.stringify({
    email: gmailAddress,
    scope: tokenData.scope || "",
    token_type: tokenData.token_type || "bearer",
  });

  await d1Query(
    `INSERT INTO integrations (id, user_id, provider, status, access_token, refresh_token, metadata, connected_at)
     VALUES (?, ?, 'gmail', 'connected', ?, ?, ?, datetime('now'))
     ON CONFLICT(user_id, provider) DO UPDATE SET
       status = 'connected',
       access_token = excluded.access_token,
       refresh_token = excluded.refresh_token,
       metadata = excluded.metadata,
       connected_at = datetime('now'),
       updated_at = datetime('now')`,
    [id, userId, encryptedAccess, encryptedRefresh, metadata],
  );
}

/* ── GET /api/integrations/callback ──────────────────────── */

// NOTE: This route is marked as public in middleware.ts because
// OAuth providers redirect the user here and Clerk session cookies
// may not be present on the redirect request.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    // Handle OAuth errors
    if (error) {
      console.error("OAuth callback error:", error);
      return NextResponse.redirect(
        new URL("/integrations?error=oauth_failed", request.url),
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL("/integrations?error=missing_code_or_state", request.url),
      );
    }

    // Detect provider from state prefix
    const provider = detectProvider(state);
    if (!provider) {
      return NextResponse.redirect(
        new URL("/integrations?error=unknown_provider", request.url),
      );
    }

    // --- Resolve the authenticated user ---
    let userId: string | null = null;

    try {
      const clerkAuth = await auth();
      userId = clerkAuth.userId;
    } catch {
      // Expected during cross-origin redirect — fall through
    }

    if (!userId) {
      // Verify HMAC signature and extract userId from state
      const secret =
        provider === "zoom"
          ? process.env.ZOOM_CLIENT_SECRET
          : process.env.GMAIL_CLIENT_SECRET;

      if (secret) {
        userId = verifyState(state, secret, `${provider}-oauth`);
      }
    }

    if (!userId) {
      return NextResponse.redirect(
        new URL("/sign-in?redirect=/integrations", request.url),
      );
    }

    // --- Ensure user row exists (FK constraint) ---
    await ensureUserExists(userId);

    // --- Provider-specific token exchange & storage ---
    if (provider === "zoom") {
      const tokenResponse = await exchangeZoomCode(code);
      if (!tokenResponse.access_token) {
        return NextResponse.redirect(
          new URL("/integrations?error=token_exchange_failed", request.url),
        );
      }
      await storeZoomTokens(userId, tokenResponse);
      return NextResponse.redirect(
        new URL("/integrations?success=zoom_connected", request.url),
      );
    }

    if (provider === "gmail") {
      const tokenResponse = await exchangeGmailCode(code);
      if (!tokenResponse.access_token) {
        return NextResponse.redirect(
          new URL("/integrations?error=token_exchange_failed", request.url),
        );
      }
      await storeGmailTokens(userId, tokenResponse);
      return NextResponse.redirect(
        new URL("/integrations?success=gmail_connected", request.url),
      );
    }

    return NextResponse.redirect(
      new URL("/integrations?error=unsupported_provider", request.url),
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("OAuth callback failed:", msg);
    return NextResponse.redirect(
      new URL(`/integrations?error=callback_failed&details=${encodeURIComponent(msg)}`, request.url),
    );
  }
}