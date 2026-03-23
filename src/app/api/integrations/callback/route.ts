import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { d1Query } from "@/lib/cloudflare";

// Zoom OAuth callback handler
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

    // Handle OAuth errors
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

    // Verify state parameter for security
    if (!state) {
      return NextResponse.redirect(
        new URL("/integrations?error=missing_state", request.url)
      );
    }

    // Get authenticated user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.redirect(
        new URL("/sign-in?redirect=/integrations", request.url)
      );
    }

    // Exchange authorization code for access token
    const tokenResponse = await exchangeCodeForToken(code);

    if (!tokenResponse.access_token) {
      return NextResponse.redirect(
        new URL("/integrations?error=token_exchange_failed", request.url)
      );
    }

    // Store the tokens in database
    await storeZoomTokens(userId, tokenResponse);

    // Redirect back to integrations page with success
    return NextResponse.redirect(
      new URL("/integrations?success=zoom_connected", request.url)
    );

  } catch (err) {
    console.error("Zoom OAuth callback error:", err);
    // Log more details for debugging
    console.error("Error details:", {
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      url: request.url,
      searchParams: Object.fromEntries(new URL(request.url).searchParams)
    });

    // Include error details in redirect for easier debugging
    const errorMessage = err instanceof Error ? err.message : String(err);
    const encodedError = encodeURIComponent(errorMessage.substring(0, 100)); // Limit length

    return NextResponse.redirect(
      new URL(`/integrations?error=callback_error&details=${encodedError}`, request.url)
    );
  }
}

// Exchange Zoom authorization code for access token
async function exchangeCodeForToken(code: string) {
  const zoomClientId = process.env.ZOOM_CLIENT_ID;
  const zoomClientSecret = process.env.ZOOM_CLIENT_SECRET;
  const redirectUri = 'https://app.schedulemuseai.com/api/integrations/callback';

  if (!zoomClientId || !zoomClientSecret) {
    throw new Error("Zoom credentials not configured");
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
    const error = await response.text();
    console.error("Zoom token exchange failed:", error);
    throw new Error(`Token exchange failed: ${response.status}`);
  }

  return await response.json();
}

// Store Zoom tokens in database
async function storeZoomTokens(userId: string, tokenData: any) {
  const id = `int-zoom-${Date.now()}-${Math.round(Math.random() * 100000)}`;

  // Encrypt sensitive tokens (you might want to add proper encryption here)
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