import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import crypto from "crypto";

/* ── Helpers ─────────────────────────────────────────────── */

/** Build an HMAC-signed state string: prefix.userId.timestamp.nonce.signature */
function buildSignedState(prefix: string, userId: string, secret: string): string {
  const timestamp = Date.now().toString(36);
  const nonce = crypto.randomBytes(8).toString("hex");
  const payload = `${prefix}.${userId}.${timestamp}.${nonce}`;
  const signature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  return `${payload}.${signature}`;
}

/* ── Route ───────────────────────────────────────────────── */

/**
 * POST /api/integrations/connect
 *
 * Generates an OAuth authorization URL for the requested provider.
 * Expects JSON body: { provider: "zoom" | "gmail" }
 *
 * Uses an HMAC-signed state parameter so the callback can verify
 * the userId even if the Clerk session cookie is lost during the redirect.
 */
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Default to "zoom" for backward compatibility (the old UI sent no body)
    let provider = "zoom";
    try {
      const body = await request.json();
      if (body?.provider) provider = body.provider;
    } catch {
      // Empty body → default to zoom
    }

    /* ── Zoom ──────────────────────────────────────────── */
    if (provider === "zoom") {
      const clientId = process.env.ZOOM_CLIENT_ID;
      const clientSecret = process.env.ZOOM_CLIENT_SECRET;
      const redirectUri =
        process.env.ZOOM_REDIRECT_URI ||
        "https://app.schedulemuseai.com/api/integrations/callback";

      if (!clientId || !clientSecret) {
        return NextResponse.json(
          { error: "Zoom credentials not configured" },
          { status: 500 },
        );
      }

      const state = buildSignedState("zoom-oauth", userId, clientSecret);
      const scope = "meeting:write:meeting meeting:read:meeting user:read:user";

      const url = new URL("https://zoom.us/oauth/authorize");
      url.searchParams.set("response_type", "code");
      url.searchParams.set("client_id", clientId);
      url.searchParams.set("redirect_uri", redirectUri);
      url.searchParams.set("scope", scope);
      url.searchParams.set("state", state);

      return NextResponse.json({ url: url.toString() });
    }

    /* ── Gmail ─────────────────────────────────────────── */
    if (provider === "gmail") {
      const clientId = process.env.GMAIL_CLIENT_ID;
      const clientSecret = process.env.GMAIL_CLIENT_SECRET;
      const redirectUri =
        process.env.GMAIL_REDIRECT_URI ||
        "https://schedulemuseai.com/api/integrations/callback";

      if (!clientId || !clientSecret) {
        return NextResponse.json(
          { error: "Gmail credentials not configured" },
          { status: 500 },
        );
      }

      const state = buildSignedState("gmail-oauth", userId, clientSecret);

      // Gmail send scope + user email scope for profile identification
      const scope = [
        "https://www.googleapis.com/auth/gmail.send",
        "https://www.googleapis.com/auth/userinfo.email",
      ].join(" ");

      const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      url.searchParams.set("response_type", "code");
      url.searchParams.set("client_id", clientId);
      url.searchParams.set("redirect_uri", redirectUri);
      url.searchParams.set("scope", scope);
      url.searchParams.set("state", state);
      url.searchParams.set("access_type", "offline"); // Required to get refresh_token
      url.searchParams.set("prompt", "consent");       // Force consent to always get refresh_token

      return NextResponse.json({ url: url.toString() });
    }

    return NextResponse.json({ error: `Unsupported provider: ${provider}` }, { status: 400 });
  } catch (err) {
    console.error("POST /api/integrations/connect error:", err);
    return NextResponse.json(
      { error: "Failed to generate OAuth URL" },
      { status: 500 },
    );
  }
}
