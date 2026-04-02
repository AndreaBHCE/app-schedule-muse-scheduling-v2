import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import crypto from "crypto";
import { validateSmtpCredentials } from "@/lib/integrations/smtp";
import { encryptToken } from "@/lib/crypto";
import { d1Query } from "@/lib/cloudflare";

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
    let body: Record<string, unknown> = {};
    try {
      body = await request.json();
      if (body?.provider) provider = body.provider as string;
    } catch {
      // Empty body → default to zoom
    }

    /* ── Zoom ──────────────────────────────────────────── */
    if (provider === "zoom") {
      const clientId = process.env.ZOOM_CLIENT_ID;
      const clientSecret = process.env.ZOOM_CLIENT_SECRET;
      const redirectUri = process.env.ZOOM_REDIRECT_URI;

      if (!clientId || !clientSecret || !redirectUri) {
        return NextResponse.json(
          { error: "Zoom credentials not configured — set ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET, and ZOOM_REDIRECT_URI" },
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
      const redirectUri = process.env.GMAIL_REDIRECT_URI;

      if (!clientId || !clientSecret || !redirectUri) {
        return NextResponse.json(
          { error: "Gmail credentials not configured — set GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, and GMAIL_REDIRECT_URI" },
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

    /* ── SMTP ──────────────────────────────────────────── */
    if (provider === "smtp") {
      const host = body.host as string | undefined;
      const port = body.port as number | undefined;
      const username = body.username as string | undefined;
      const password = body.password as string | undefined;
      const from_email = body.from_email as string | undefined;
      const encryption = body.encryption as string | undefined;

      if (!host || !port || !username || !password || !from_email) {
        const missing = [
          !host && "host",
          !port && "port",
          !username && "username",
          !password && "password",
          !from_email && "from_email",
        ].filter(Boolean);
        return NextResponse.json(
          { error: `Missing required SMTP fields: ${missing.join(", ")}` },
          { status: 400 },
        );
      }

      const validEncryption = ["tls", "starttls", "none"] as const;
      const enc = validEncryption.includes(encryption as typeof validEncryption[number])
        ? (encryption as "tls" | "starttls" | "none")
        : "tls";

      // Validate credentials by connecting to the SMTP server
      const validation = await validateSmtpCredentials({
        host, port: Number(port), username, password, from_email, encryption: enc,
      });

      if (!validation.valid) {
        return NextResponse.json(
          { error: `SMTP connection failed: ${validation.error}` },
          { status: 422 },
        );
      }

      // Encrypt password, store config in metadata
      const encryptedPassword = encryptToken(password);
      const metadata = JSON.stringify({ host, port: Number(port), username, from_email, encryption: enc });
      const id = `int-${crypto.randomUUID()}`;

      // Upsert: if SMTP integration already exists for this user, update it
      const existing = await d1Query(
        `SELECT id FROM integrations WHERE user_id = ? AND provider = 'smtp'`,
        [userId],
      );

      if (existing.results && existing.results.length > 0) {
        await d1Query(
          `UPDATE integrations SET status = 'connected', access_token = ?, metadata = ?, connected_at = datetime('now'), updated_at = datetime('now') WHERE user_id = ? AND provider = 'smtp'`,
          [encryptedPassword, metadata, userId],
        );
      } else {
        await d1Query(
          `INSERT INTO integrations (id, user_id, provider, status, access_token, refresh_token, metadata, connected_at)
           VALUES (?, ?, 'smtp', 'connected', ?, '', ?, datetime('now'))`,
          [id, userId, encryptedPassword, metadata],
        );
      }

      return NextResponse.json({ success: true });
    }

    /* ── Google Calendar ───────────────────────────────────── */
    if (provider === "google_calendar") {
      const clientId = process.env.GMAIL_CLIENT_ID;
      const clientSecret = process.env.GMAIL_CLIENT_SECRET;
      const redirectUri = process.env.GMAIL_REDIRECT_URI;

      if (!clientId || !clientSecret || !redirectUri) {
        return NextResponse.json(
          { error: "Google Calendar credentials not configured — set GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, and GMAIL_REDIRECT_URI" },
          { status: 500 },
        );
      }

      const state = buildSignedState("gcal-oauth", userId, clientSecret);

      const scope = [
        "https://www.googleapis.com/auth/calendar.events",
        "https://www.googleapis.com/auth/userinfo.email",
      ].join(" ");

      const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      url.searchParams.set("response_type", "code");
      url.searchParams.set("client_id", clientId);
      url.searchParams.set("redirect_uri", redirectUri);
      url.searchParams.set("scope", scope);
      url.searchParams.set("state", state);
      url.searchParams.set("access_type", "offline");
      url.searchParams.set("prompt", "consent");

      return NextResponse.json({ url: url.toString() });
    }

    /* ── Google Meet ──────────────────────────────────────── */
    if (provider === "google_meet") {
      const clientId = process.env.GMAIL_CLIENT_ID;
      const clientSecret = process.env.GMAIL_CLIENT_SECRET;
      const redirectUri = process.env.GMAIL_REDIRECT_URI;

      if (!clientId || !clientSecret || !redirectUri) {
        return NextResponse.json(
          { error: "Google Meet credentials not configured — set GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, and GMAIL_REDIRECT_URI" },
          { status: 500 },
        );
      }

      const state = buildSignedState("gmeet-oauth", userId, clientSecret);

      // Meet links require calendar.events scope (Meet is created via Calendar API)
      const scope = [
        "https://www.googleapis.com/auth/calendar.events",
        "https://www.googleapis.com/auth/userinfo.email",
      ].join(" ");

      const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      url.searchParams.set("response_type", "code");
      url.searchParams.set("client_id", clientId);
      url.searchParams.set("redirect_uri", redirectUri);
      url.searchParams.set("scope", scope);
      url.searchParams.set("state", state);
      url.searchParams.set("access_type", "offline");
      url.searchParams.set("prompt", "consent");

      return NextResponse.json({ url: url.toString() });
    }

    /* ── GoTo Meeting ──────────────────────────────────────── */
    if (provider === "goto") {
      const clientId = process.env.GOTOMEETING_CLIENT_ID;
      const clientSecret = process.env.GOTOMEETING_SECRET;
      const redirectUri = process.env.GOTOMEETING_REDIRECT_URI;

      if (!clientId || !clientSecret || !redirectUri) {
        return NextResponse.json(
          { error: "GoTo Meeting credentials not configured — set GOTOMEETING_CLIENT_ID, GOTOMEETING_SECRET, and GOTOMEETING_REDIRECT_URI" },
          { status: 500 },
        );
      }

      const state = buildSignedState("goto-oauth", userId, clientSecret);

      const url = new URL("https://authentication.logmeininc.com/oauth/authorize");
      url.searchParams.set("response_type", "code");
      url.searchParams.set("client_id", clientId);
      url.searchParams.set("redirect_uri", redirectUri);
      url.searchParams.set("state", state);

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
