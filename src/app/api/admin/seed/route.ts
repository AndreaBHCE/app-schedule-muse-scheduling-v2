import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";
import { d1Query } from "@/lib/cloudflare";
import { requireAdmin, AuthError } from "@/lib/auth";

/**
 * POST /api/admin/seed
 *
 * Creates all tables and inserts sample data for the authenticated user.
 * Uses the real Clerk userId so data belongs to the signed-in account.
 *
 * Schema DDL is read from the canonical schema.sql at the project root.
 * Do NOT duplicate CREATE TABLE statements here.
 */
export async function POST() {
  try {
    const USER_ID = await requireAdmin();

    // ── Create tables from canonical schema.sql ────────────
    const schemaPath = join(process.cwd(), "schema.sql");
    const schemaSql = readFileSync(schemaPath, "utf-8");

    // Split on semicolons, strip comments and whitespace, drop empty entries
    const statements = schemaSql
      .split(";")
      .map((s) => s.replace(/--.*$/gm, "").trim())
      .filter((s) => s.length > 0);

    for (const sql of statements) {
      await d1Query(sql);
    }

    // ── Ensure user row exists (requireAdmin → getAuthUserId → ensureUserRow) ──
    // No additional user insert needed — handled by the auth chain above.

    // ── Seed booking pages ─────────────────────────────────
    const bookingPages = [
      { id: "bp-1", title: "30-min Strategy Session", slug: "strategy-30", desc: "A quick strategy call to align on goals.", dur: 30, buf: 5, status: "published", color: "#0d9488", loc: "virtual", locD: "https://meet.schedulemuseai.com/strategy", b7: 12, conv: 8.5 },
      { id: "bp-2", title: "60-min Deep Dive", slug: "deep-dive-60", desc: "Extended session for complex topics.", dur: 60, buf: 10, status: "published", color: "#6366f1", loc: "virtual", locD: "https://meet.schedulemuseai.com/deepdive", b7: 6, conv: 3.2 },
      { id: "bp-3", title: "15-min Quick Check-in", slug: "checkin-15", desc: "Fast sync for ongoing projects.", dur: 15, buf: 5, status: "published", color: "#f59e0b", loc: "phone", locD: "+1-555-0100", b7: 18, conv: 12.1 },
      { id: "bp-4", title: "Coffee Chat", slug: "coffee-chat", desc: "Informal meet & greet over coffee.", dur: 30, buf: 0, status: "draft", color: "#ec4899", loc: "in-person", locD: "Cafe Luma, Downtown", b7: 0, conv: 0 },
      { id: "bp-5", title: "Product Demo", slug: "product-demo", desc: "Walk through our latest features.", dur: 45, buf: 15, status: "published", color: "#8b5cf6", loc: "virtual", locD: "https://meet.schedulemuseai.com/demo", b7: 9, conv: -2.3 },
      { id: "bp-6", title: "Team Retrospective", slug: "retro", desc: "End-of-sprint team reflection.", dur: 60, buf: 10, status: "paused", color: "#14b8a6", loc: "virtual", locD: "https://meet.schedulemuseai.com/retro", b7: 2, conv: -5.0 },
    ];

    for (const bp of bookingPages) {
      await d1Query(
        `INSERT OR IGNORE INTO booking_pages (id, user_id, title, slug, description, duration_minutes, buffer_minutes, status, color, location_type, location_details, bookings_last_7d, conversion_delta_pct)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [bp.id, USER_ID, bp.title, bp.slug, bp.desc, bp.dur, bp.buf, bp.status, bp.color, bp.loc, bp.locD, bp.b7, bp.conv],
      );
    }

    // ── Seed meetings ──────────────────────────────────────
    // We create meetings relative to "today" so the calendar always has data
    const now = new Date();
    function at(dayOffset: number, hour: number, minute = 0): string {
      const d = new Date(now);
      d.setDate(d.getDate() + dayOffset);
      d.setHours(hour, minute, 0, 0);
      return d.toISOString();
    }
    function endAt(dayOffset: number, hour: number, minute: number, durMin: number): string {
      const d = new Date(now);
      d.setDate(d.getDate() + dayOffset);
      d.setHours(hour, minute + durMin, 0, 0);
      return d.toISOString();
    }

    const meetings = [
      { id: "m-1",  bp: "bp-1", guest: "Jordan Blake",   email: "jordan.blake@example.com",   type: "30-min Strategy Session",  dOff: 0,  h: 9,  m: 0,  dur: 30,  status: "confirmed", loc: "virtual",   locD: "https://meet.schedulemuseai.com/abc123" },
      { id: "m-2",  bp: "bp-4", guest: "Skyler Reeves",  email: "skyler.reeves@example.com",  type: "Coffee Chat",              dOff: 0,  h: 11, m: 0,  dur: 30,  status: "confirmed", loc: "in-person", locD: "Cafe Luma, Downtown" },
      { id: "m-3",  bp: "bp-2", guest: "Taylor Morgan",  email: "taylor.morgan@example.com",  type: "60-min Deep Dive",         dOff: 0,  h: 14, m: 30, dur: 60,  status: "pending",   loc: "phone",     locD: "+1-555-0100" },
      { id: "m-4",  bp: "bp-1", guest: "Sam Rivera",     email: "sam.rivera@example.com",     type: "Team Onboarding",          dOff: 1,  h: 10, m: 0,  dur: 30,  status: "confirmed", loc: "in-person", locD: "Office 42, 123 Main St" },
      { id: "m-5",  bp: "bp-3", guest: "Alex Chen",      email: "alex.chen@example.com",      type: "15-min Check-in",          dOff: 1,  h: 15, m: 0,  dur: 15,  status: "confirmed", loc: "virtual",   locD: "https://meet.schedulemuseai.com/xyz789" },
      { id: "m-6",  bp: "bp-5", guest: "Morgan Lee",     email: "morgan.lee@example.com",     type: "Product Demo",             dOff: 2,  h: 11, m: 0,  dur: 45,  status: "confirmed", loc: "virtual",   locD: "https://meet.schedulemuseai.com/demo456" },
      { id: "m-7",  bp: "bp-6", guest: "Casey Nguyen",   email: "casey.nguyen@example.com",   type: "Quarterly Review",         dOff: 4,  h: 9,  m: 30, dur: 60,  status: "pending",   loc: "in-person", locD: "Conference Room B" },
      { id: "m-8",  bp: "bp-1", guest: "Riley Patel",    email: "riley.patel@example.com",    type: "Client Kickoff",           dOff: 7,  h: 13, m: 0,  dur: 30,  status: "confirmed", loc: "virtual",   locD: "https://meet.schedulemuseai.com/kick001" },
      { id: "m-9",  bp: "bp-2", guest: "Jamie Foster",   email: "jamie.foster@example.com",   type: "Design Review",            dOff: 10, h: 10, m: 30, dur: 60,  status: "confirmed", loc: "virtual",   locD: "https://meet.schedulemuseai.com/design88" },
      { id: "m-10", bp: "bp-6", guest: "Drew Simmons",   email: "drew.simmons@example.com",   type: "Sprint Retrospective",     dOff: 14, h: 16, m: 0,  dur: 60,  status: "pending",   loc: "virtual",   locD: "https://meet.schedulemuseai.com/retro22" },
      { id: "m-11", bp: "bp-3", guest: "Avery Kim",      email: "avery.kim@example.com",      type: "1-on-1 Sync",              dOff: 21, h: 11, m: 0,  dur: 15,  status: "confirmed", loc: "phone",     locD: "+1-555-0200" },
      { id: "m-12", bp: "bp-2", guest: "Quinn Ortiz",    email: "quinn.ortiz@example.com",    type: "End-of-Month Wrap-up",     dOff: 28, h: 14, m: 0,  dur: 60,  status: "confirmed", loc: "in-person", locD: "Board Room, Floor 3" },
      // Past meetings for analytics
      { id: "m-13", bp: "bp-1", guest: "Jordan Blake",   email: "jordan.blake@example.com",   type: "30-min Strategy Session",  dOff: -1, h: 9,  m: 0,  dur: 30,  status: "completed", loc: "virtual",   locD: "https://meet.schedulemuseai.com/abc123" },
      { id: "m-14", bp: "bp-3", guest: "Alex Chen",      email: "alex.chen@example.com",      type: "15-min Check-in",          dOff: -2, h: 14, m: 0,  dur: 15,  status: "completed", loc: "virtual",   locD: "https://meet.schedulemuseai.com/xyz789" },
      { id: "m-15", bp: "bp-5", guest: "Morgan Lee",     email: "morgan.lee@example.com",     type: "Product Demo",             dOff: -3, h: 10, m: 0,  dur: 45,  status: "completed", loc: "virtual",   locD: "https://meet.schedulemuseai.com/demo456" },
      { id: "m-16", bp: "bp-1", guest: "Riley Patel",    email: "riley.patel@example.com",    type: "Client Kickoff",           dOff: -5, h: 15, m: 0,  dur: 30,  status: "no-show",   loc: "virtual",   locD: "https://meet.schedulemuseai.com/kick001" },
      { id: "m-17", bp: "bp-2", guest: "Jamie Foster",   email: "jamie.foster@example.com",   type: "Design Review",            dOff: -7, h: 11, m: 0,  dur: 60,  status: "completed", loc: "virtual",   locD: "https://meet.schedulemuseai.com/design88" },
      { id: "m-18", bp: "bp-4", guest: "Skyler Reeves",  email: "skyler.reeves@example.com",  type: "Coffee Chat",              dOff: -10,h: 9,  m: 30, dur: 30,  status: "canceled",  loc: "in-person", locD: "Cafe Luma, Downtown" },
      { id: "m-19", bp: "bp-1", guest: "Sam Rivera",     email: "sam.rivera@example.com",     type: "Team Onboarding",          dOff: -14,h: 10, m: 0,  dur: 30,  status: "completed", loc: "in-person", locD: "Office 42, 123 Main St" },
      { id: "m-20", bp: "bp-3", guest: "Casey Nguyen",   email: "casey.nguyen@example.com",   type: "15-min Check-in",          dOff: -21,h: 16, m: 0,  dur: 15,  status: "completed", loc: "phone",     locD: "+1-555-0100" },
    ];

    for (const mt of meetings) {
      await d1Query(
        `INSERT OR IGNORE INTO meetings (id, user_id, booking_page_id, guest_name, guest_email, meeting_type, start_time, end_time, status, location_type, location_details)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [mt.id, USER_ID, mt.bp, mt.guest, mt.email, mt.type, at(mt.dOff, mt.h, mt.m), endAt(mt.dOff, mt.h, mt.m, mt.dur), mt.status, mt.loc, mt.locD],
      );
    }

    // ── Seed contacts ──────────────────────────────────────
    const contacts = [
      { id: "c-1",  firstName: "Jordan",  lastName: "Blake",   email: "jordan.blake@example.com",  phone: "+1-555-0101", company: "Blake Consulting",   tags: '["client","vip"]',    mc: 5, lm: at(-1, 9) },
      { id: "c-2",  firstName: "Skyler",  lastName: "Reeves",  email: "skyler.reeves@example.com", phone: "+1-555-0102", company: "Reeves Design Co",   tags: '["prospect"]',        mc: 2, lm: at(-10, 9) },
      { id: "c-3",  firstName: "Taylor",  lastName: "Morgan",  email: "taylor.morgan@example.com", phone: "+1-555-0103", company: "Morgan Ventures",    tags: '["client"]',          mc: 3, lm: at(0, 14) },
      { id: "c-4",  firstName: "Sam",     lastName: "Rivera",  email: "sam.rivera@example.com",    phone: "+1-555-0104", company: "Rivera Tech",         tags: '["team","internal"]', mc: 4, lm: at(-14, 10) },
      { id: "c-5",  firstName: "Alex",    lastName: "Chen",    email: "alex.chen@example.com",     phone: "+1-555-0105", company: "Chen Analytics",      tags: '["client"]',          mc: 6, lm: at(-2, 14) },
      { id: "c-6",  firstName: "Morgan",  lastName: "Lee",     email: "morgan.lee@example.com",    phone: "",            company: "FutureStack Inc",     tags: '["prospect"]',        mc: 2, lm: at(-3, 10) },
      { id: "c-7",  firstName: "Casey",   lastName: "Nguyen",  email: "casey.nguyen@example.com",  phone: "+1-555-0107", company: "Nguyen & Partners",   tags: '["client","vip"]',    mc: 8, lm: at(-21, 16) },
      { id: "c-8",  firstName: "Riley",   lastName: "Patel",   email: "riley.patel@example.com",   phone: "+1-555-0108", company: "Patel Solutions",     tags: '["prospect"]',        mc: 1, lm: at(-5, 15) },
      { id: "c-9",  firstName: "Jamie",   lastName: "Foster",  email: "jamie.foster@example.com",  phone: "+1-555-0109", company: "Foster Creative",     tags: '["client"]',          mc: 3, lm: at(-7, 11) },
      { id: "c-10", firstName: "Drew",    lastName: "Simmons", email: "drew.simmons@example.com",  phone: "",            company: "Simmons Group",       tags: '["team"]',            mc: 2, lm: null },
      { id: "c-11", firstName: "Avery",   lastName: "Kim",     email: "avery.kim@example.com",     phone: "+1-555-0111", company: "Kim Enterprises",     tags: '["client"]',          mc: 1, lm: null },
      { id: "c-12", firstName: "Quinn",   lastName: "Ortiz",   email: "quinn.ortiz@example.com",   phone: "+1-555-0112", company: "Ortiz & Associates",  tags: '["client","vip"]',    mc: 4, lm: null },
    ];

    for (const c of contacts) {
      await d1Query(
        `INSERT OR IGNORE INTO contacts (id, user_id, first_name, last_name, email, phone, company, tags, total_meetings, last_meeting_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          c.id,
          USER_ID,
          c.firstName,
          c.lastName,
          c.email,
          c.phone,
          c.company,
          c.tags,
          c.mc,
          c.lm,
        ],
      );
    }

    // ── Seed integrations ──────────────────────────────────
    const integrations = [
      { id: "int-1", provider: "google_calendar", status: "connected", syncAt: at(-30, 10) },
      { id: "int-2", provider: "zoom",            status: "connected", syncAt: at(-25, 14) },
      { id: "int-3", provider: "stripe",          status: "disconnected", syncAt: null },
      { id: "int-4", provider: "slack",            status: "connected", syncAt: at(-15, 9) },
      { id: "int-5", provider: "hubspot",          status: "disconnected", syncAt: null },
      { id: "int-6", provider: "microsoft_teams",  status: "error",     syncAt: at(-5, 11) },
    ];

    for (const integ of integrations) {
      await d1Query(
        `INSERT OR IGNORE INTO integrations (id, user_id, provider, status, last_synced_at)
         VALUES (?, ?, ?, ?, ?)`,
        [integ.id, USER_ID, integ.provider, integ.status, integ.syncAt],
      );
    }

    // ── Seed availability ──────────────────────────────────
    const defaultAvailability = JSON.stringify({
      mon: [{ start: "09:00", end: "17:00" }],
      tue: [{ start: "09:00", end: "17:00" }],
      wed: [{ start: "09:00", end: "17:00" }],
      thu: [{ start: "09:00", end: "17:00" }],
      fri: [{ start: "09:00", end: "17:00" }],
      sat: [],
      sun: [],
    });

    await d1Query(
      `INSERT OR IGNORE INTO availability_schedules (id, user_id, name, timezone, rules, is_default)
       VALUES (?, ?, ?, ?, ?, ?)`,
      ["avail-1", USER_ID, "Business Hours", "America/New_York", defaultAvailability, 1],
    );

    return NextResponse.json({
      success: true,
      message: "Schema created and seed data inserted.",
      tables: ["users", "booking_pages", "meetings", "contacts", "integrations", "availability_schedules", "api_keys", "webhooks"],
    });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("Seed error:", err);
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 },
    );
  }
}
