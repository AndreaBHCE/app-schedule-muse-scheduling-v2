import { NextResponse } from "next/server";
import { d1Query } from "@/lib/cloudflare";

const DEMO_USER_ID = "user_demo_000";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const days = parseInt(url.searchParams.get("days") || "30");

  try {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceISO = since.toISOString();

    // Run all aggregation queries
    const [totalMeetings, statusBreakdown, dailyCounts, topBookingPages, locationBreakdown, avgPerDay] =
      await Promise.all([
        d1Query<{ cnt: number }>(
          `SELECT COUNT(*) as cnt FROM meetings WHERE user_id = ? AND created_at >= ?`,
          [DEMO_USER_ID, sinceISO],
        ),
        d1Query<{ status: string; cnt: number }>(
          `SELECT status, COUNT(*) as cnt FROM meetings WHERE user_id = ? AND created_at >= ? GROUP BY status`,
          [DEMO_USER_ID, sinceISO],
        ),
        d1Query<{ day: string; cnt: number }>(
          `SELECT DATE(start_time) as day, COUNT(*) as cnt
           FROM meetings WHERE user_id = ? AND start_time >= ?
           GROUP BY DATE(start_time) ORDER BY day ASC`,
          [DEMO_USER_ID, sinceISO],
        ),
        d1Query<{ title: string; cnt: number }>(
          `SELECT bp.title, COUNT(*) as cnt
           FROM meetings m JOIN booking_pages bp ON m.booking_page_id = bp.id
           WHERE m.user_id = ? AND m.created_at >= ?
           GROUP BY bp.id ORDER BY cnt DESC LIMIT 5`,
          [DEMO_USER_ID, sinceISO],
        ),
        d1Query<{ location_type: string; cnt: number }>(
          `SELECT location_type, COUNT(*) as cnt
           FROM meetings WHERE user_id = ? AND created_at >= ?
           GROUP BY location_type`,
          [DEMO_USER_ID, sinceISO],
        ),
        d1Query<{ avg_per_day: number }>(
          `SELECT CAST(COUNT(*) AS FLOAT) / MAX(1, JULIANDAY('now') - JULIANDAY(?)) as avg_per_day
           FROM meetings WHERE user_id = ? AND start_time >= ?`,
          [sinceISO, DEMO_USER_ID, sinceISO],
        ),
      ]);

    // Compute completion rate
    const statusMap: Record<string, number> = {};
    statusBreakdown.results.forEach((r) => (statusMap[r.status] = r.cnt));
    const completed = statusMap["completed"] || 0;
    const noShow = statusMap["no-show"] || 0;
    const canceled = statusMap["canceled"] || 0;
    const total = totalMeetings.results[0]?.cnt || 0;
    const completionRate = total > 0 ? Math.round(((completed / (total - canceled)) * 100) || 0) : 0;
    const noShowRate = total > 0 ? Math.round(((noShow / (total - canceled)) * 100) || 0) : 0;

    return NextResponse.json({
      period: { days, since: sinceISO },
      totalMeetings: total,
      completionRate,
      noShowRate,
      canceledCount: canceled,
      avgPerDay: Math.round((avgPerDay.results[0]?.avg_per_day || 0) * 10) / 10,
      statusBreakdown: statusMap,
      dailyCounts: dailyCounts.results.map((r) => ({ date: r.day, count: r.cnt })),
      topBookingPages: topBookingPages.results.map((r) => ({ title: r.title, count: r.cnt })),
      locationBreakdown: locationBreakdown.results.map((r) => ({ type: r.location_type, count: r.cnt })),
    });
  } catch (err) {
    console.error("GET /api/analytics error:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
