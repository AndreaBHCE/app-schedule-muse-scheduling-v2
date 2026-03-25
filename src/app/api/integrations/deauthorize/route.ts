import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { d1Query } from "@/lib/cloudflare";

/**
 * Verify that the request genuinely came from Zoom.
 * Zoom signs every webhook with HMAC-SHA256:
 *   message  = "v0:{timestamp}:{rawBody}"
 *   expected = "v0=" + hmac_sha256(secret, message)
 * The signature is sent in the x-zm-signature header.
 *
 * Returns true only if the secret is configured AND the signature is valid.
 * If the secret env var is missing, returns false (fail closed).
 */
function verifyZoomSignature(
  rawBody: string,
  timestamp: string | null,
  signature: string | null,
): boolean {
  const secret = process.env.ZOOM_WEBHOOK_SECRET_TOKEN;
  if (!secret) {
    console.error(
      "ZOOM_WEBHOOK_SECRET_TOKEN is not set — rejecting webhook. " +
        "Configure this env var to process Zoom deauthorization events.",
    );
    return false;
  }
  if (!timestamp || !signature) return false;

  const message = `v0:${timestamp}:${rawBody}`;
  const expected = `v0=${crypto.createHmac("sha256", secret).update(message).digest("hex")}`;

  // Timing-safe comparison to prevent timing attacks
  if (expected.length !== signature.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

// Zoom deauthorization webhook handler
// Zoom calls this when users disconnect the app
export async function POST(request: NextRequest) {
  try {
    // Read raw body BEFORE parsing — signature covers the exact bytes
    const rawBody = await request.text();
    const timestamp = request.headers.get("x-zm-request-timestamp");
    const signature = request.headers.get("x-zm-signature");

    if (!verifyZoomSignature(rawBody, timestamp, signature)) {
      console.warn("Zoom deauthorize: invalid signature — rejecting request");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const body = JSON.parse(rawBody);
    const { user_id: zoomUserId, account_id: zoomAccountId } = body;

    if (!zoomUserId && !zoomAccountId) {
      return NextResponse.json(
        { error: "Missing user_id or account_id" },
        { status: 400 },
      );
    }

    // Find and disconnect the integration
    // Match by Zoom user ID or account ID stored in metadata
    let query = `UPDATE integrations SET status = 'disconnected', updated_at = datetime('now') WHERE provider = 'zoom'`;
    const params: string[] = [];

    if (zoomUserId) {
      query += ` AND json_extract(metadata, '$.zoom_user_id') = ?`;
      params.push(zoomUserId);
    } else if (zoomAccountId) {
      query += ` AND json_extract(metadata, '$.account_id') = ?`;
      params.push(zoomAccountId);
    }

    const result = await d1Query(query, params);

    if (result.meta?.changes && result.meta.changes > 0) {
      console.log(
        `Zoom integration disconnected for user: ${zoomUserId || zoomAccountId}`,
      );
    } else {
      console.warn(
        `No Zoom integration found for user: ${zoomUserId || zoomAccountId}`,
      );
    }

    // Always return success to Zoom to prevent retries
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Zoom deauthorization error:", err);
    // Return success to Zoom even on error to avoid retries
    return NextResponse.json({ success: true }, { status: 200 });
  }
}

// Zoom may also send GET requests for verification
export async function GET(_request: NextRequest) {
  return NextResponse.json({ success: true });
}
