import { NextResponse } from "next/server";
import { d1Query } from "@/lib/cloudflare";

export async function POST() {
  try {
    // Add missing columns to contacts table
    await d1Query(`ALTER TABLE contacts ADD COLUMN first_name TEXT DEFAULT ''`);
    await d1Query(`ALTER TABLE contacts ADD COLUMN last_name TEXT DEFAULT ''`);

    // Check if meeting_count exists and rename to total_meetings
    try {
      await d1Query(`ALTER TABLE contacts RENAME COLUMN meeting_count TO total_meetings`);
    } catch (e) {
      // Column might already be renamed or not exist
      console.log("meeting_count column might not exist or already renamed");
    }

    return NextResponse.json({ success: true, message: "Migration completed" });
  } catch (err) {
    console.error("Migration error:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
