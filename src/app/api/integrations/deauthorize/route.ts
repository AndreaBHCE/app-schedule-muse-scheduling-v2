import { NextRequest, NextResponse } from "next/server";
import { d1Query } from "@/lib/cloudflare";

// Zoom deauthorization webhook handler
// Zoom calls this when users disconnect the app
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
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