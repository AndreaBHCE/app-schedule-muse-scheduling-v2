import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { d1Query } from "@/lib/cloudflare";

const WEBHOOK_SECRET = process.env.ZOOM_WEBHOOK_SECRET_TOKEN!;

/**
 * Verify that the request genuinely came from Zoom.
 * Zoom signs every webhook with HMAC-SHA256:
 *   message  = "v0:{timestamp}:{rawBody}"
 *   expected = "v0=" + hmac_sha256(secret, message)
 * The signature is sent in the x-zm-signature header.
 */
function verifyZoomSignature(
  rawBody: string,
  timestamp: string | null,
  signature: string | null,
): boolean {
  if (!timestamp || !signature) return false;

  const message = `v0:${timestamp}:${rawBody}`;
  const expected = `v0=${crypto.createHmac("sha256", WEBHOOK_SECRET).update(message).digest("hex")}`;

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
      return NextResponse.json({ error: "Missing user_id or account_id" }, { status: 400 });
    }

    // Find and disconnect the integration
    // We need to match by Zoom user ID or account ID stored in metadata
    let query = `UPDATE integrations SET status = 'disconnected', updated_at = datetime('now') WHERE provider = 'zoom'`;
    let params: any[] = [];

    if (zoomUserId) {
      query += ` AND json_extract(metadata, '$.zoom_user_id') = ?`;
      params.push(zoomUserId);
    } else if (zoomAccountId) {
      query += ` AND json_extract(metadata, '$.account_id') = ?`;
      params.push(zoomAccountId);
    }

    const result = await d1Query(query, params);

    if (result.meta?.changes && result.meta.changes > 0) {
      console.log(`Zoom integration disconnected for user: ${zoomUserId || zoomAccountId}`);
      return NextResponse.json({ success: true });
    } else {
      console.warn(`No Zoom integration found for user: ${zoomUserId || zoomAccountId}`);
      return NextResponse.json({ success: true }); // Still return success to Zoom
    }

  } catch (err) {
    console.error("Zoom deauthorization error:", err);
    // Return success to Zoom even on error to avoid retries
    return NextResponse.json({ success: true }, { status: 200 });
  }
}

// Zoom may also send GET requests for verification
export async function GET(request: NextRequest) {
  // Return success for any GET requests (Zoom verification)
  return NextResponse.json({ success: true });
}