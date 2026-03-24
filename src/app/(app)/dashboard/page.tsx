"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import UserProfile from "@/components/layout/UserProfile";

type Booking = {
  id: string;
  title: string;
  durationMinutes: number;
  bufferMinutes: number;
  status: "Published" | "Draft" | "Paused";
  createdAt: string;
  updatedAt: string;
  bookingsLast7Days: number;
  conversionDeltaPercent: number;
};

type MeetingEvent = {
  id: string;
  startTime: string;
  guestName: string;
  guestEmail: string;
  meetingType: string;
  status: "confirmed" | "pending" | "canceled";
  location: "virtual" | "phone" | "in-person";
  locationDetails: string;
};

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  confirmed: { bg: "var(--cal-hover)",  text: "var(--cal-heading)", border: "var(--cal-primary)" },
  pending:   { bg: "#fef3c7",           text: "#92400e",            border: "#f59e0b" },
  canceled:  { bg: "#ffe4e6",           text: "#9f1239",            border: "#f43f5e" },
};

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7 AM – 8 PM
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatHour(hour: number): string {
  if (hour === 0) return "12 AM";
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return "12 PM";
  return `${hour - 12} PM`;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function DashboardPage() {
  const { user } = useUser();
  const firstName = user?.firstName || "";
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Booking | null>(null);
  const [deleteInput, setDeleteInput] = useState("");

  const [events, setEvents] = useState<MeetingEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [range, setRange] = useState<"day" | "week" | "month">("day");
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const today = new Date();

  /* ── Server-side KPIs ── */
  const [kpis, setKpis] = useState({
    bookings7d: 0, bookings30d: 0,
    meetingsCompleted7d: 0, meetingsCompleted30d: 0,
    noShowsPct7d: 0,
  });

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((data) => {
        if (data.bookings7d !== undefined) setKpis(data);
      })
      .catch((err: unknown) => {
        console.warn("Failed to load dashboard KPIs:", err);
      });
  }, []);

  useEffect(() => {
    let canceled = false;

    async function loadBookings() {
      try {
        const response = await fetch("/api/bookings");
        if (!response.ok) throw new Error("Failed to load bookings");
        const json = await response.json();
        if (!canceled) {
          setBookings(json.bookings || []);
          setError(null);
        }
      } catch (err) {
        if (!canceled) setError((err as Error).message);
      } finally {
        if (!canceled) setLoading(false);
      }
    }

    loadBookings();
    return () => {
      canceled = true;
    };
  }, []);

  useEffect(() => {
    let canceled = false;
    async function loadEvents() {
      try {
        setEventsLoading(true);
        const dateStr = currentDate.toISOString().split("T")[0];
        const response = await fetch(`/api/events?range=${range}&date=${dateStr}`);
        if (!response.ok) throw new Error("Failed to load upcoming meetings");
        const json = await response.json();
        if (!canceled) { setEvents(json.events || []); setEventsError(null); }
      } catch (err) { if (!canceled) setEventsError((err as Error).message); }
      finally { if (!canceled) setEventsLoading(false); }
    }
    loadEvents();
    return () => { canceled = true; };
  }, [range, currentDate]);

  /* ---------- navigation ---------- */
  function navigate(direction: -1 | 1) {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      if (range === "day") d.setDate(d.getDate() + direction);
      else if (range === "week") d.setDate(d.getDate() + 7 * direction);
      else d.setMonth(d.getMonth() + direction);
      return d;
    });
  }

  function goToToday() { setCurrentDate(new Date()); }

  async function handleDelete() {
    if (!deleteTarget || deleteInput !== "DELETE") return;
    try {
      const res = await fetch(`/api/bookings/${encodeURIComponent(deleteTarget.id)}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setBookings((prev) => prev.filter((b) => b.id !== deleteTarget.id));
    } catch {
      setError("Failed to delete booking calendar.");
    } finally {
      setDeleteTarget(null);
      setDeleteInput("");
    }
  }

  function getCalendarLabel(): string {
    if (range === "day") {
      return currentDate.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    }
    if (range === "week") {
      const ws = new Date(currentDate);
      ws.setDate(ws.getDate() - ws.getDay());
      const we = new Date(ws);
      we.setDate(we.getDate() + 6);
      return `${ws.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${we.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;
    }
    return currentDate.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  }

  /* ---------- event card ---------- */
  function eventCard(event: MeetingEvent, compact = false) {
    const colors = STATUS_COLORS[event.status] || STATUS_COLORS.confirmed;
    const time = new Date(event.startTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    if (compact) {
      return (
        <div key={event.id} className="truncate rounded px-1.5 py-0.5 mb-0.5 text-[10px] leading-tight border-l-2" style={{ background: colors.bg, color: colors.text, borderLeftColor: colors.border }}>
          {time} {event.meetingType}
        </div>
      );
    }
    return (
      <div key={event.id} className="rounded-lg px-3 py-2 mb-1 border-l-4" style={{ background: colors.bg, borderLeftColor: colors.border }}>
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-sm" style={{ color: colors.text }}>{event.meetingType}</span>
          <span className="text-[10px]" style={{ color: 'var(--cal-mid)' }}>{time}</span>
        </div>
        <div className="text-xs mt-0.5" style={{ color: 'var(--cal-text)' }}>{event.guestName}</div>
        <div className="text-[10px]" style={{ color: 'var(--cal-mid)' }}>{event.location} • {event.locationDetails}</div>
      </div>
    );
  }

  /* ---------- Day view ---------- */
  function renderDayView() {
    return (
      <div>
        {HOURS.map((hour) => {
          const hourEvents = events.filter((e) => new Date(e.startTime).getHours() === hour);
          return (
            <div key={hour} className="cal-row grid grid-cols-[64px,1fr] min-h-[52px]" style={{ borderBottom: '1px solid var(--cal-border)' }}>
              <div className="pr-3 pt-2 text-right font-medium text-[11px]" style={{ color: 'var(--cal-mid)' }}>{formatHour(hour)}</div>
              <div className="pl-3 py-1" style={{ borderLeft: '1px solid var(--cal-border)' }}>
                {hourEvents.map((e) => eventCard(e))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  /* ---------- Week view ---------- */
  function renderWeekView() {
    const weekStart = new Date(currentDate);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
    return (
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const dayEvents = events.filter((e) => isSameDay(new Date(e.startTime), day));
          const isToday_ = isSameDay(day, today);
          return (
            <div key={day.toISOString()} className="min-h-[220px]" style={{ borderRight: i < 6 ? '1px solid var(--cal-border)' : undefined }}>
              <div className="text-center py-2" style={{ borderBottom: '1px solid var(--cal-border)', background: isToday_ ? 'var(--cal-today-bg)' : undefined }}>
                <div className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--cal-mid)' }}>{DAY_NAMES[day.getDay()]}</div>
                <div className="text-lg font-bold mt-0.5" style={{ color: isToday_ ? 'var(--cal-primary)' : 'var(--cal-heading)' }}>{day.getDate()}</div>
              </div>
              <div className="p-1.5 space-y-1">
                {dayEvents.map((e) => eventCard(e, true))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  /* ---------- Month view ---------- */
  function renderMonthView() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDow = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDow; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);

    const weeks: (number | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

    return (
      <div>
        <div className="grid grid-cols-7 text-center" style={{ borderBottom: '1px solid var(--cal-border)' }}>
          {DAY_NAMES.map((d) => (
            <div key={d} className="py-2 text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--cal-mid)' }}>{d}</div>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7" style={{ borderBottom: '1px solid var(--cal-border)' }}>
            {week.map((day, di) => {
              const dayEvents = day
                ? events.filter((e) => { const ed = new Date(e.startTime); return ed.getDate() === day && ed.getMonth() === month; })
                : [];
              const isToday_ = day !== null && today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
              return (
                <div key={di} className={`min-h-[80px] p-1 ${day === null ? "" : "cal-cell"}`} style={{ borderRight: di < 6 ? '1px solid var(--cal-border)' : undefined, background: day === null ? 'var(--cal-bg-alt)' : undefined }}>
                  {day !== null && (
                    <>
                      <div className="text-xs font-semibold mb-1 w-6 h-6 flex items-center justify-center" style={isToday_ ? { background: 'var(--cal-primary)', color: 'white', borderRadius: '50%' } : { color: 'var(--cal-text)' }}>
                        {day}
                      </div>
                      {dayEvents.slice(0, 3).map((e) => eventCard(e, true))}
                      {dayEvents.length > 3 && (
                        <div className="text-[9px] pl-1" style={{ color: 'var(--cal-mid)' }}>+{dayEvents.length - 3} more</div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
        <header className="app-header relative">
          <div>
            <h1 className="app-company-name">ScheduleMuseAI</h1>
            <h2 className="app-page-name">Welcome back{firstName ? `, ${firstName}` : ""}.</h2>
            <p className="app-subtitle">
              Your scheduling dashboard gives you full control over booking calendars, availability, and reminders — all powered by ScheduleMuse AI.
            </p>
          </div>
          <div className="app-cta">
            <Link href="/meeting-setup" className="btn-primary">
              Create booking calendar
            </Link>
            <Link href="/analytics" className="btn-secondary">View analytics</Link>
          </div>
          <div className="absolute top-6 right-6">
            <UserProfile />
          </div>
        </header>

        <section className="card">
          <h3 className="card-title">Recently updated</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {bookings.slice(0, 6).map((booking) => (
              <article key={booking.id} className="card bg-slate-900 p-4 border border-slate-700">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-lg font-semibold text-white">{booking.title}</h4>
                  <span className={`text-xs font-medium ${booking.status === "Published" ? "text-emerald-400" : booking.status === "Draft" ? "text-amber-300" : "text-slate-300"}`}>
                    {booking.status}
                  </span>
                </div>
                <p className="text-xs text-white/60">Updated {new Date(booking.updatedAt).toLocaleString()}</p>
                <div className="mt-3 flex items-center justify-between text-sm text-white/70">
                  <span>{booking.bookingsLast7Days} bookings (7d)</span>
                  <span className={`${booking.conversionDeltaPercent >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                    {booking.conversionDeltaPercent > 0 ? "+" : ""}{booking.conversionDeltaPercent}%
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Link href={`/meeting-setup?edit=${booking.id}`} className="rounded px-3 py-1 text-xs font-semibold bg-slate-700 text-white hover:bg-slate-600">Edit</Link>
                  <button className="rounded px-3 py-1 text-xs font-semibold bg-slate-700 text-white hover:bg-slate-600">Share</button>
                  <button className="rounded px-3 py-1 text-xs font-semibold bg-slate-700 text-white hover:bg-slate-600">Archive</button>
                  <button onClick={() => { setDeleteTarget(booking); setDeleteInput(""); }} className="rounded px-3 py-1 text-xs font-semibold bg-slate-700 text-white hover:bg-slate-600">Delete</button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="card">
          <h3 className="card-title">Your Booking Calendars</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {bookings.map((booking) => (
              <article key={booking.id} className="card bg-slate-900 p-4 border border-slate-700">
                <h4 className="font-semibold text-white">{booking.title}</h4>
                <p className="text-sm text-white/70">Status: {booking.status}</p>
                <p className="text-xs text-white/50">Updated {new Date(booking.updatedAt).toLocaleDateString()}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="card">
          <div className="grid gap-3 sm:grid-cols-3">
            <article className="rounded-xl border p-4 shadow-sm" style={{ background: 'oklch(0.846 0.039 196.711)', borderColor: 'oklch(0.78 0.06 196.711)' }}>
              <p className="text-xs uppercase tracking-wide" style={{ color: 'oklch(0.35 0.04 196.711)' }}>Bookings created</p>
              <p className="text-3xl font-bold" style={{ color: 'oklch(0.15 0.03 196.711)' }}>{(kpis?.bookings7d ?? 0)} / {(kpis?.bookings30d ?? 0)}</p>
              <p className="text-xs mt-1" style={{ color: 'oklch(0.35 0.04 196.711)' }}>Last 7d / 30d</p>
            </article>
            <article className="rounded-xl border p-4 shadow-sm" style={{ background: 'oklch(0.846 0.039 196.711)', borderColor: 'oklch(0.78 0.06 196.711)' }}>
              <p className="text-xs uppercase tracking-wide" style={{ color: 'oklch(0.35 0.04 196.711)' }}>Meetings completed</p>
              <p className="text-3xl font-bold" style={{ color: 'oklch(0.15 0.03 196.711)' }}>{(kpis?.meetingsCompleted7d ?? 0)} / {(kpis?.meetingsCompleted30d ?? 0)}</p>
              <p className="text-xs mt-1" style={{ color: 'oklch(0.35 0.04 196.711)' }}>Last 7d / 30d</p>
            </article>
            <article className="rounded-xl border p-4 shadow-sm" style={{ background: 'oklch(0.846 0.039 196.711)', borderColor: 'oklch(0.78 0.06 196.711)' }}>
              <p className="text-xs uppercase tracking-wide" style={{ color: 'oklch(0.35 0.04 196.711)' }}>No-shows</p>
              <p className="text-3xl font-bold" style={{ color: 'oklch(0.15 0.03 196.711)' }}>{(kpis?.noShowsPct7d ?? 0).toFixed(1)}%</p>
              <p className="text-xs mt-1" style={{ color: 'oklch(0.35 0.04 196.711)' }}>Last 7d</p>
            </article>
          </div>
        </section>

        <section className="card">
          <h3 className="card-title mb-3">My Upcoming Meetings</h3>

          <div>
            <div className="cal-grid">
              {/* Calendar header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3" style={{ borderBottom: '1px solid var(--cal-border)' }}>
                <div className="flex items-center gap-2">
                  <button onClick={() => navigate(-1)} className="cal-nav-btn" aria-label="Previous">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  </button>
                  <button onClick={goToToday} className="cal-view-btn">Today</button>
                  <button onClick={() => navigate(1)} className="cal-nav-btn" aria-label="Next">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                  </button>
                  <span className="text-sm font-semibold" style={{ color: 'var(--cal-heading)' }}>{getCalendarLabel()}</span>
                </div>
                <div className="flex items-center gap-1">
                  {(["day", "week", "month"] as const).map((target) => (
                    <button
                      key={target}
                      onClick={() => setRange(target)}
                      className={`cal-view-btn ${range === target ? "cal-view-btn--active" : ""}`}
                    >
                      {target === "day" ? "Day" : target === "week" ? "Week" : "Month"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Calendar body */}
              {eventsLoading && <div className="p-8 text-center" style={{ color: 'var(--cal-mid)' }}>Loading meetings…</div>}
              {eventsError && <div className="p-8 text-center text-rose-500">{eventsError}</div>}
              {!eventsLoading && !eventsError && (
                <>
                  {range === "day" && renderDayView()}
                  {range === "week" && renderWeekView()}
                  {range === "month" && renderMonthView()}
                </>
              )}
            </div>
          </div>
        </section>

        {/* ── Delete Confirmation Modal ─────── */}
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="rounded-xl p-6 shadow-xl w-full max-w-md" style={{ background: "var(--cal-bg)" }}>
              <h3 className="text-lg font-bold mb-2" style={{ color: "var(--cal-heading)" }}>Delete Booking Calendar</h3>
              <p className="text-sm mb-1" style={{ color: "var(--cal-text)" }}>
                You are about to permanently delete <strong style={{ color: "var(--cal-heading)" }}>{deleteTarget.title}</strong>. This action cannot be undone.
              </p>
              <p className="text-sm mb-4" style={{ color: "var(--cal-text)" }}>
                Type <strong style={{ color: "#9f1239" }}>DELETE</strong> below to confirm:
              </p>
              <input
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="w-full rounded-lg border px-3 py-2 text-sm mb-4"
                style={{ borderColor: deleteInput === "DELETE" ? "#9f1239" : "var(--cal-border)", background: "var(--cal-bg-alt)", color: "var(--cal-text)" }}
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button onClick={() => { setDeleteTarget(null); setDeleteInput(""); }} className="btn-secondary">Cancel</button>
                <button
                  onClick={handleDelete}
                  disabled={deleteInput !== "DELETE"}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity"
                  style={{ background: deleteInput === "DELETE" ? "#9f1239" : "#ccc", opacity: deleteInput === "DELETE" ? 1 : 0.5 }}
                >
                  Permanently Delete
                </button>
              </div>
            </div>
          </div>
        )}

    </>
  );
}
