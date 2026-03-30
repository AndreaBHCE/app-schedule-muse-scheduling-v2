import { NextResponse } from "next/server";
import { d1Query } from "@/lib/cloudflare";
import { requireAdmin, AuthError } from "@/lib/auth";

export async function POST() {
  try {
    const userId = await requireAdmin();

    // Add first_name / last_name columns if missing (idempotent)
    try {
      await d1Query(`ALTER TABLE contacts ADD COLUMN first_name TEXT DEFAULT ''`);
    } catch {
      // Column already exists
    }
    try {
      await d1Query(`ALTER TABLE contacts ADD COLUMN last_name TEXT DEFAULT ''`);
    } catch {
      // Column already exists
    }

    // Rename meeting_count → total_meetings if needed
    try {
      await d1Query(`ALTER TABLE contacts RENAME COLUMN meeting_count TO total_meetings`);
    } catch {
      // Column might already be renamed or not exist
    }

    // Drop legacy name column if it exists (canonical source is first_name + last_name)
    try {
      await d1Query(`ALTER TABLE contacts DROP COLUMN name`);
    } catch {
      // Column may not exist
    }

    // Add scopes column to api_keys if missing (for H5 API key scopes)
    try {
      await d1Query(`ALTER TABLE api_keys ADD COLUMN scopes TEXT NOT NULL DEFAULT '["meetings:read"]'`);
    } catch {
      // Column already exists
    }

    // Add preferences column to users if missing (for M6 onboarding)
    try {
      await d1Query(`ALTER TABLE users ADD COLUMN preferences TEXT DEFAULT '{}'`);
    } catch {
      // Column already exists
    }

    // Add token/metadata columns to integrations if missing (for Zoom OAuth)
    try {
      await d1Query(`ALTER TABLE integrations ADD COLUMN access_token TEXT DEFAULT ''`);
    } catch {
      // Column already exists
    }
    try {
      await d1Query(`ALTER TABLE integrations ADD COLUMN refresh_token TEXT DEFAULT ''`);
    } catch {
      // Column already exists
    }
    try {
      await d1Query(`ALTER TABLE integrations ADD COLUMN metadata TEXT DEFAULT '{}'`);
    } catch {
      // Column already exists
    }
    try {
      await d1Query(`ALTER TABLE integrations ADD COLUMN connected_at TEXT`);
    } catch {
      // Column already exists
    }

    // Create rate_limits table for middleware-enforced rate limiting (idempotent)
    await d1Query(`CREATE TABLE IF NOT EXISTS rate_limits (
      key        TEXT    NOT NULL,
      window     INTEGER NOT NULL,
      hits       INTEGER NOT NULL DEFAULT 1,
      PRIMARY KEY (key, window)
    )`);

    // Drop static analytics columns — now computed live from meetings table
    try {
      await d1Query(`ALTER TABLE booking_pages DROP COLUMN bookings_last_7d`);
    } catch {
      // Column may not exist
    }
    try {
      await d1Query(`ALTER TABLE booking_pages DROP COLUMN conversion_delta_pct`);
    } catch {
      // Column may not exist
    }

    return NextResponse.json({
      success: true,
      message: "Migration completed — columns added/verified, legacy columns dropped, rate_limits table ensured.",
    });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("Migration error:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
