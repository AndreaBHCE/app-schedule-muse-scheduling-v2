"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AppSidebar from "@/components/layout/AppSidebar";

type Meeting = {
  id: string;
  bookingPageId: string;
  meetingType: string;
  guestName: string;
  guestEmail: string;
  startTime: string;
  endTime: string;
  status: string;
  locationType: string;
  locationDetails: string;
  notes: string;
  canceledReason: string;
  createdAt: string;
};

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  confirmed:  { bg: "var(--cal-hover)",  text: "var(--cal-heading)", dot: "var(--cal-primary)" },
  pending:    { bg: "#fef3c7",           text: "#92400e",            dot: "#f59e0b" },
  completed:  { bg: "var(--cal-bg-alt)", text: "var(--cal-text)",    dot: "var(--cal-mid)" },
  canceled:   { bg: "#ffe4e6",           text: "#9f1239",            dot: "#f43f5e" },
  "no-show":  { bg: "#fef3c7",           text: "#92400e",            dot: "#f97316" },
};

type Tab = "upcoming" | "past" | "canceled" | "all";

export default function YourMeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("upcoming");
  const [page, setPage] = useState(1);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const limit = 10;

  useEffect(() => {
    let dead = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/meetings?status=${tab}&page=${page}&limit=${limit}`);
        const json = await res.json();
        if (!dead) {
          setMeetings(json.meetings || []);
          setTotal(json.total || 0);
        }
      } catch {
        if (!dead) setMeetings([]);
      } finally {
        if (!dead) setLoading(false);
      }
    }
    load();
    return () => { dead = true; };
  }, [tab, page]);

  async function cancelMeeting() {
    if (!cancelId) return;
    await fetch("/api/meetings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: cancelId, status: "canceled", canceledReason: cancelReason }),
    });
    setCancelId(null);
    setCancelReason("");
    setMeetings((prev) => prev.map((m) => m.id === cancelId ? { ...m, status: "canceled" } : m));
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "upcoming", label: "Upcoming" },
    { key: "past",     label: "Past" },
    { key: "canceled", label: "Canceled" },
    { key: "all",      label: "All" },
  ];

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="app-layout">
      <AppSidebar />

      <main className="app-main">
        <header className="app-header">
          <div>
            <h1 className="app-company-name">ScheduleMuseAI</h1>
            <h2 className="app-page-name">Your Meetings</h2>
            <p className="app-subtitle">
              View, filter, and manage all your scheduled meetings in one place.
            </p>
          </div>
          <div className="app-cta">
            <Link href="/meeting-setup" className="btn-primary">Create booking page</Link>
          </div>
        </header>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-4">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setPage(1); }}
              className={`cal-view-btn ${tab === t.key ? "cal-view-btn--active" : ""}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <section className="card overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center" style={{ color: "var(--cal-mid)" }}>Loading meetings…</div>
          ) : meetings.length === 0 ? (
            <div className="p-8 text-center" style={{ color: "var(--cal-mid)" }}>No meetings found.</div>
          ) : (
            <table className="w-full text-sm" style={{ color: "var(--cal-text)" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--cal-border)" }}>
                  <th className="text-left py-3 px-3 font-semibold text-xs uppercase tracking-wide" style={{ color: "var(--cal-mid)" }}>Guest</th>
                  <th className="text-left py-3 px-3 font-semibold text-xs uppercase tracking-wide" style={{ color: "var(--cal-mid)" }}>Type</th>
                  <th className="text-left py-3 px-3 font-semibold text-xs uppercase tracking-wide" style={{ color: "var(--cal-mid)" }}>Date &amp; Time</th>
                  <th className="text-left py-3 px-3 font-semibold text-xs uppercase tracking-wide" style={{ color: "var(--cal-mid)" }}>Location</th>
                  <th className="text-left py-3 px-3 font-semibold text-xs uppercase tracking-wide" style={{ color: "var(--cal-mid)" }}>Status</th>
                  <th className="text-right py-3 px-3 font-semibold text-xs uppercase tracking-wide" style={{ color: "var(--cal-mid)" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {meetings.map((m) => {
                  const s = STATUS_STYLES[m.status] || STATUS_STYLES.confirmed;
                  const dt = new Date(m.startTime);
                  return (
                    <tr key={m.id} className="cal-row" style={{ borderBottom: "1px solid var(--cal-border)" }}>
                      <td className="py-3 px-3">
                        <div className="font-semibold" style={{ color: "var(--cal-heading)" }}>{m.guestName}</div>
                        <div className="text-xs" style={{ color: "var(--cal-mid)" }}>{m.guestEmail}</div>
                      </td>
                      <td className="py-3 px-3">{m.meetingType}</td>
                      <td className="py-3 px-3">
                        <div>{dt.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</div>
                        <div className="text-xs" style={{ color: "var(--cal-mid)" }}>
                          {dt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-xs">{m.locationType}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
                          style={{ background: s.bg, color: s.text }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />
                          {m.status.charAt(0).toUpperCase() + m.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {["confirmed", "pending"].includes(m.status) && (
                          <button
                            onClick={() => setCancelId(m.id)}
                            className="rounded px-3 py-1 text-xs font-semibold hover:opacity-80"
                            style={{ background: "#ffe4e6", color: "#9f1239" }}
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-3 py-3" style={{ borderTop: "1px solid var(--cal-border)" }}>
              <span className="text-xs" style={{ color: "var(--cal-mid)" }}>
                Page {page} of {totalPages} · {total} meetings
              </span>
              <div className="flex gap-1">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="cal-nav-btn" aria-label="Previous page">
                  ←
                </button>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="cal-nav-btn" aria-label="Next page">
                  →
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Cancel modal */}
        {cancelId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="rounded-xl p-6 shadow-xl w-full max-w-md" style={{ background: "var(--cal-bg)" }}>
              <h3 className="text-lg font-bold mb-2" style={{ color: "var(--cal-heading)" }}>Cancel Meeting</h3>
              <p className="text-sm mb-3" style={{ color: "var(--cal-text)" }}>
                Are you sure you want to cancel this meeting? This cannot be undone.
              </p>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Reason for cancellation (optional)"
                rows={3}
                className="w-full rounded-lg border px-3 py-2 text-sm mb-4"
                style={{ borderColor: "var(--cal-border)", background: "var(--cal-bg-alt)", color: "var(--cal-text)" }}
              />
              <div className="flex justify-end gap-2">
                <button onClick={() => { setCancelId(null); setCancelReason(""); }} className="btn-secondary">
                  Keep Meeting
                </button>
                <button onClick={cancelMeeting} className="rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ background: "#e11d48" }}>
                  Confirm Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
