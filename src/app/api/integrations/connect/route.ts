import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import crypto from "crypto";

/**
 * POST /api/integrations/connect
 *
 * Generates a Zoom OAuth authorization URL with an HMAC-signed state
 * parameter. Keeping this server-side ensures the client secret and
 * signing key never touch the browser.
 */
export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

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

    // Build state: prefix.userId.timestamp.random
    const timestamp = Date.now().toString(36);
    const nonce = crypto.randomBytes(8).toString("hex");
    const payload = `zoom-oauth.${userId}.${timestamp}.${nonce}`;

    // HMAC-SHA256 signature using the Zoom client secret as the key
    const signature = crypto
      .createHmac("sha256", clientSecret)
      .update(payload)
      .digest("hex");

    const state = `${payload}.${signature}`;

    const scope = "meeting:write:meeting meeting:read:meeting user:read:user";

    const url = new URL("https://zoom.us/oauth/authorize");
    url.searchParams.set("response_type", "code");
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("scope", scope);
    url.searchParams.set("state", state);

    return NextResponse.json({ url: url.toString() });
  } catch (err) {
    console.error("POST /api/integrations/connect error:", err);
    return NextResponse.json(
      { error: "Failed to generate OAuth URL" },
      { status: 500 },
    );
  }
}
