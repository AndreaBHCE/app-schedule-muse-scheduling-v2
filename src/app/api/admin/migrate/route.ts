import { NextResponse } from "next/server";
import { d1Query } from "@/lib/cloudflare";
import { getAuthUserId, AuthError } from "@/lib/auth";

export async function POST() {
  try {
    const userId = await getAuthUserId();

    // TODO: Add admin role check here
    // For now, any authenticated user can migrate (restrict in production)

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

    // Add name column if missing (keep for backward compatibility)
    try {
      await d1Query(`ALTER TABLE contacts ADD COLUMN name TEXT DEFAULT ''`);
    } catch {
      // Column already exists
    }

    // Backfill: sync name from first_name + last_name for any rows that have
    // first_name/last_name but an empty name column
    await d1Query(
      `UPDATE contacts
       SET name = TRIM(COALESCE(first_name, '') || ' ' || COALESCE(last_name, ''))
       WHERE (name IS NULL OR name = '')
         AND (first_name != '' OR last_name != '')`,
    );

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

    return NextResponse.json({
      success: true,
      message: "Migration completed — columns added/verified, name column synced.",
    });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("Migration error:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
