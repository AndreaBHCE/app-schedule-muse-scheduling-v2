import { NextResponse } from "next/server";
import { d1Query } from "@/lib/cloudflare";
import { resolveAuth, AuthError } from "@/lib/auth";
import { requireScope } from "@/lib/apikey";

/**
 * GET /api/dashboard — server-side KPI computation for the dashboard.
 *
 * Returns summary stats computed via SQL aggregation so the client
 * never has to download and process the full dataset.
 */
export async function GET(request: Request) {
  try {
    const { userId, scopes } = await resolveAuth(request);
    // Dashboard is read-only, needs at least one read scope (or Clerk session)
    if (scopes !== null) {
      // API key user — require at least analytics:read or meetings:read
      const hasRead = scopes.some((s) => s.endsWith(":read"));
      if (!hasRead) {
        return NextResponse.json(
          { error: "API key missing required read scope" },
          { status: 403 },
        );
      }
    }

    const now = new Date();
    const minus7 = new Date(now);
    minus7.setDate(minus7.getDate() - 7);
    const minus30 = new Date(now);
    minus30.setDate(minus30.getDate() - 30);
    const iso7 = minus7.toISOString();
    const iso30 = minus30.toISOString();

    const [
      bookingPages7d,
      bookingPages30d,
      meetings7d,
      meetings30d,
      noShows7d,
      candidateCount7d,
      userRow,
    ] = await Promise.all([
      // Booking pages created in last 7 days
      d1Query<{ cnt: number }>(
        `SELECT COUNT(*) as cnt FROM booking_pages
         WHERE user_id = ? AND created_at >= ?`,
        [userId, iso7],
      ),
      // Booking pages created in last 30 days
      d1Query<{ cnt: number }>(
        `SELECT COUNT(*) as cnt FROM booking_pages
         WHERE user_id = ? AND created_at >= ?`,
        [userId, iso30],
      ),
      // Confirmed meetings (completed or confirmed) in last 7 days
      d1Query<{ cnt: number }>(
        `SELECT COUNT(*) as cnt FROM meetings
         WHERE user_id = ? AND start_time >= ?
           AND status IN ('confirmed', 'completed')`,
        [userId, iso7],
      ),
      // Confirmed meetings in last 30 days
      d1Query<{ cnt: number }>(
        `SELECT COUNT(*) as cnt FROM meetings
         WHERE user_id = ? AND start_time >= ?
           AND status IN ('confirmed', 'completed')`,
        [userId, iso30],
      ),
      // No-shows in last 7 days
      d1Query<{ cnt: number }>(
        `SELECT COUNT(*) as cnt FROM meetings
         WHERE user_id = ? AND start_time >= ?
           AND status = 'no-show'`,
        [userId, iso7],
      ),
      // All non-pending meetings in last 7 days (denominator for no-show rate)
      d1Query<{ cnt: number }>(
        `SELECT COUNT(*) as cnt FROM meetings
         WHERE user_id = ? AND start_time >= ?
           AND status IN ('confirmed', 'completed', 'no-show', 'canceled')`,
        [userId, iso7],
      ),
      // User preferences for onboarding state
      d1Query<{ preferences: string }>(
        `SELECT preferences FROM users WHERE id = ?`,
        [userId],
      ),
    ]);

    const noShowCount = noShows7d.results[0]?.cnt || 0;
    const candidateTotal = candidateCount7d.results[0]?.cnt || 0;
    const noShowsPct = candidateTotal > 0
      ? Number(((noShowCount / candidateTotal) * 100).toFixed(1))
      : 0;

    // Parse onboarding status from preferences JSON
    let onboardingComplete = false;
    const prefRaw = userRow.results[0]?.preferences;
    if (prefRaw) {
      try {
        const prefs = JSON.parse(prefRaw);
        onboardingComplete = prefs.onboardingComplete === true;
      } catch {
        // Malformed JSON — treat as not onboarded
      }
    }

    return NextResponse.json({
      bookings7d: bookingPages7d.results[0]?.cnt || 0,
      bookings30d: bookingPages30d.results[0]?.cnt || 0,
      meetingsCompleted7d: meetings7d.results[0]?.cnt || 0,
      meetingsCompleted30d: meetings30d.results[0]?.cnt || 0,
      noShowsPct7d: noShowsPct,
      onboardingComplete,
    });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("GET /api/dashboard error:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
