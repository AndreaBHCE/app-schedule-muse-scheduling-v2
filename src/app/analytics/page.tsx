"use client";

import { useEffect, useState } from "react";
import AppSidebar from "@/components/layout/AppSidebar";

type Analytics = {
  period: { days: number; since: string };
  totalMeetings: number;
  completionRate: number;
  noShowRate: number;
  canceledCount: number;
  avgPerDay: number;
  statusBreakdown: Record<string, number>;
  dailyCounts: { date: string; count: number }[];
  topBookingPages: { title: string; count: number }[];
  locationBreakdown: { type: string; count: number }[];
};

const PERIOD_OPTIONS = [
  { label: "7 days", value: 7 },
  { label: "30 days", value: 30 },
  { label: "90 days", value: 90 },
];

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    let dead = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/analytics?days=${days}`);
        const json = await res.json();
        if (!dead) setData(json);
      } catch {
        if (!dead) setData(null);
      } finally {
        if (!dead) setLoading(false);
      }
    }
    load();
    return () => { dead = true; };
  }, [days]);

  /* Simple sparkline bar chart */
  function BarChart({ items, color }: { items: { label: string; value: number }[]; color: string }) {
    const max = Math.max(...items.map((i) => i.value), 1);
    return (
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-3">
            <span className="text-xs w-28 truncate text-right" style={{ color: "var(--cal-mid)" }}>{item.label}</span>
            <div className="flex-1 h-5 rounded-full overflow-hidden" style={{ background: "var(--cal-bg-alt)" }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${(item.value / max) * 100}%`, background: color }} />
            </div>
            <span className="text-xs font-semibold w-8 text-right" style={{ color: "var(--cal-heading)" }}>{item.value}</span>
          </div>
        ))}
      </div>
    );
  }

  /* Mini daily activity chart */
  function DailyChart({ dailyCounts }: { dailyCounts: { date: string; count: number }[] }) {
    const max = Math.max(...dailyCounts.map((d) => d.count), 1);
    const barWidth = dailyCounts.length > 0 ? Math.max(4, Math.floor(600 / dailyCounts.length) - 2) : 8;
    return (
      <div className="flex items-end gap-[2px] h-32 overflow-x-auto pb-1">
        {dailyCounts.map((d) => (
          <div key={d.date} className="flex flex-col items-center gap-1 flex-shrink-0">
            <div
              className="rounded-t"
              style={{
                width: barWidth,
                height: `${Math.max(4, (d.count / max) * 112)}px`,
                background: d.count > 0 ? "var(--cal-primary)" : "var(--cal-border)",
              }}
              title={`${d.date}: ${d.count}`}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="app-layout">
      <AppSidebar />

      <main className="app-main">
        <header className="app-header">
          <div>
            <h1 className="app-company-name">ScheduleMuseAI</h1>
            <h2 className="app-page-name">Analytics</h2>
            <p className="app-subtitle">
              Understand your scheduling patterns with real metrics from your meetings.
            </p>
          </div>
          <div className="app-cta">
            <div className="flex items-center gap-1">
              {PERIOD_OPTIONS.map((p) => (
                <button key={p.value} onClick={() => setDays(p.value)}
                  className={`cal-view-btn ${days === p.value ? "cal-view-btn--active" : ""}`}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        {loading ? (
          <div className="p-12 text-center" style={{ color: "var(--cal-mid)" }}>Loading analytics…</div>
        ) : !data ? (
          <div className="p-12 text-center" style={{ color: "var(--cal-mid)" }}>No data available.</div>
        ) : (
          <>
            {/* KPI cards */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 mb-6">
              {[
                { label: "Total Meetings", value: String(data.totalMeetings) },
                { label: "Completion Rate", value: `${data.completionRate}%` },
                { label: "No-Show Rate", value: `${data.noShowRate}%` },
                { label: "Canceled", value: String(data.canceledCount) },
                { label: "Avg / Day", value: String(data.avgPerDay) },
              ].map((kpi) => (
                <article key={kpi.label} className="rounded-xl border p-4" style={{ borderColor: "var(--cal-border)", background: "var(--cal-bg)" }}>
                  <p className="text-xs uppercase tracking-wide" style={{ color: "var(--cal-mid)" }}>{kpi.label}</p>
                  <p className="text-3xl font-bold mt-1" style={{ color: "var(--cal-heading)" }}>{kpi.value}</p>
                </article>
              ))}
            </div>

            {/* Daily activity */}
            <section className="card mb-6">
              <h3 className="card-title mb-4">Daily Meeting Activity</h3>
              {data.dailyCounts.length > 0 ? (
                <DailyChart dailyCounts={data.dailyCounts} />
              ) : (
                <p className="text-sm" style={{ color: "var(--cal-mid)" }}>No data for this period.</p>
              )}
              {data.dailyCounts.length > 0 && (
                <div className="flex justify-between mt-2 text-[10px]" style={{ color: "var(--cal-mid)" }}>
                  <span>{data.dailyCounts[0]?.date}</span>
                  <span>{data.dailyCounts[data.dailyCounts.length - 1]?.date}</span>
                </div>
              )}
            </section>

            <div className="grid gap-4 lg:grid-cols-2 mb-6">
              {/* Top booking pages */}
              <section className="card">
                <h3 className="card-title mb-4">Top Booking Pages</h3>
                {data.topBookingPages.length > 0 ? (
                  <BarChart items={data.topBookingPages.map((p) => ({ label: p.title, value: p.count }))} color="var(--cal-primary)" />
                ) : (
                  <p className="text-sm" style={{ color: "var(--cal-mid)" }}>No data yet.</p>
                )}
              </section>

              {/* Location breakdown */}
              <section className="card">
                <h3 className="card-title mb-4">By Location Type</h3>
                {data.locationBreakdown.length > 0 ? (
                  <BarChart items={data.locationBreakdown.map((l) => ({ label: l.type, value: l.count }))} color="var(--cal-accent)" />
                ) : (
                  <p className="text-sm" style={{ color: "var(--cal-mid)" }}>No data yet.</p>
                )}
              </section>
            </div>

            {/* Status breakdown */}
            <section className="card">
              <h3 className="card-title mb-4">Status Breakdown</h3>
              <div className="grid gap-3 sm:grid-cols-5">
                {Object.entries(data.statusBreakdown).map(([status, count]) => (
                  <div key={status} className="rounded-xl border p-3 text-center" style={{ borderColor: "var(--cal-border)", background: "var(--cal-bg-alt)" }}>
                    <p className="text-2xl font-bold" style={{ color: "var(--cal-heading)" }}>{count}</p>
                    <p className="text-xs capitalize" style={{ color: "var(--cal-mid)" }}>{status}</p>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
