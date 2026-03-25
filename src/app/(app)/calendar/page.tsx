"use client";

import { useEffect, useState } from "react";

type MeetingEvent = {
  id: string;
  startTime: string;
  endTime: string;
  guestName: string;
  guestEmail: string;
  meetingType: string;
  status: "confirmed" | "pending" | "canceled" | "completed" | "no-show";
  location: "virtual" | "phone" | "in-person";
  locationDetails: string;
};

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  confirmed:  { bg: "var(--cal-hover)",  text: "var(--cal-heading)", border: "var(--cal-primary)" },
  pending:    { bg: "#fef3c7",           text: "#92400e",            border: "#f59e0b" },
  canceled:   { bg: "#ffe4e6",           text: "#9f1239",            border: "#f43f5e" },
  completed:  { bg: "var(--cal-bg-alt)", text: "var(--cal-text)",    border: "var(--cal-mid)" },
  "no-show":  { bg: "#fef3c7",           text: "#92400e",            border: "#f97316" },
};

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7);
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function formatHour(hour: number): string {
  if (hour === 0) return "12 AM";
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return "12 PM";
  return `${hour - 12} PM`;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function mondayWeekStart(d: Date): Date {
  const out = new Date(d);
  const day = out.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  out.setDate(out.getDate() + diff);
  out.setHours(0, 0, 0, 0);
  return out;
}

export default function CalendarPage() {
  const [events, setEvents] = useState<MeetingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<"day" | "week" | "month">("week");
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedEvent, setSelectedEvent] = useState<MeetingEvent | null>(null);
  const today = new Date();

  useEffect(() => {
    let dead = false;
    async function load() {
      setLoading(true);
      try {
        const dateStr = currentDate.toISOString().split("T")[0];
        const res = await fetch(`/api/events?range=${range}&date=${dateStr}`);
        const json = await res.json();
        if (!dead) setEvents(json.events || []);
      } catch (err) {
        console.warn("Failed to load calendar events:", err);
        if (!dead) setEvents([]);
      } finally {
        if (!dead) setLoading(false);
      }
    }
    load();
    return () => { dead = true; };
  }, [range, currentDate]);

  function navigate(dir: -1 | 1) {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      if (range === "day") d.setDate(d.getDate() + dir);
      else if (range === "week") d.setDate(d.getDate() + 7 * dir);
      else d.setMonth(d.getMonth() + dir);
      return d;
    });
  }

  function goToday() { setCurrentDate(new Date()); }

  function calendarLabel(): string {
    if (range === "day")
      return currentDate.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    if (range === "week") {
      const ws = mondayWeekStart(currentDate);
      const we = new Date(ws); we.setDate(we.getDate() + 6);
      return `${ws.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${we.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;
    }
    return currentDate.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  }

  /* ── Event card ─────────────────────────────── */
  function eventCard(event: MeetingEvent, compact = false) {
    const c = STATUS_COLORS[event.status] || STATUS_COLORS.confirmed;
    const time = new Date(event.startTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    if (compact) {
      return (
        <button key={event.id} onClick={() => setSelectedEvent(event)}
          className="w-full text-left truncate rounded px-1.5 py-0.5 mb-0.5 text-[10px] leading-tight border-l-2 cursor-pointer"
          style={{ background: c.bg, color: c.text, borderLeftColor: c.border }}>
          {time} {event.meetingType}
        </button>
      );
    }
    return (
      <button key={event.id} onClick={() => setSelectedEvent(event)}
        className="w-full text-left rounded-lg px-3 py-2 mb-1 border-l-4 cursor-pointer"
        style={{ background: c.bg, borderLeftColor: c.border }}>
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-sm" style={{ color: c.text }}>{event.meetingType}</span>
          <span className="text-[10px]" style={{ color: "var(--cal-mid)" }}>{time}</span>
        </div>
        <div className="text-xs mt-0.5" style={{ color: "var(--cal-text)" }}>{event.guestName}</div>
        <div className="text-[10px]" style={{ color: "var(--cal-mid)" }}>{event.location} · {event.locationDetails}</div>
      </button>
    );
  }

  /* ── Day view ──────────────────────────── */
  function renderDayView() {
    return (
      <div>
        {HOURS.map((hour) => {
          const hourEvents = events.filter((e) => new Date(e.startTime).getHours() === hour);
          return (
            <div key={hour} className="cal-row grid grid-cols-[64px,1fr] min-h-[52px]" style={{ borderBottom: "1px solid var(--cal-border)" }}>
              <div className="pr-3 pt-2 text-right font-medium text-[11px]" style={{ color: "var(--cal-mid)" }}>{formatHour(hour)}</div>
              <div className="pl-3 py-1" style={{ borderLeft: "1px solid var(--cal-border)" }}>
                {hourEvents.map((e) => eventCard(e))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  /* ── Week view ─────────────────────────── */
  function renderWeekView() {
    const ws = mondayWeekStart(currentDate);
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(ws); d.setDate(d.getDate() + i); return d;
    });
    return (
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const dayEvents = events.filter((e) => isSameDay(new Date(e.startTime), day));
          const isToday = isSameDay(day, today);
          return (
            <div key={i} className="min-h-[260px]" style={{ borderRight: i < 6 ? "1px solid var(--cal-border)" : undefined }}>
              <div className="text-center py-2" style={{ borderBottom: "1px solid var(--cal-border)", background: isToday ? "var(--cal-today-bg)" : undefined }}>
                <div className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--cal-mid)" }}>{DAY_LABELS[i]}</div>
                <div className="text-lg font-bold mt-0.5" style={{ color: isToday ? "var(--cal-primary)" : "var(--cal-heading)" }}>{day.getDate()}</div>
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

  /* ── Month view ────────────────────────── */
  function renderMonthView() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const firstDow = firstDay.getDay();
    const monOffset = firstDow === 0 ? 6 : firstDow - 1; // Monday-first offset
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: (number | null)[] = [];
    for (let i = 0; i < monOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);

    const weeks: (number | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

    return (
      <div>
        <div className="grid grid-cols-7 text-center" style={{ borderBottom: "1px solid var(--cal-border)" }}>
          {DAY_LABELS.map((d) => (
            <div key={d} className="py-2 text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--cal-mid)" }}>{d}</div>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7" style={{ borderBottom: "1px solid var(--cal-border)" }}>
            {week.map((day, di) => {
              const dayEvents = day
                ? events.filter((e) => { const ed = new Date(e.startTime); return ed.getDate() === day && ed.getMonth() === month; })
                : [];
              const isToday_ = day !== null && today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
              return (
                <div key={di} className={`min-h-[90px] p-1 ${day === null ? "" : "cal-cell"}`}
                  style={{ borderRight: di < 6 ? "1px solid var(--cal-border)" : undefined, background: day === null ? "var(--cal-bg-alt)" : undefined }}>
                  {day !== null && (
                    <>
                      <div className="text-xs font-semibold mb-1 w-6 h-6 flex items-center justify-center"
                        style={isToday_ ? { background: "var(--cal-primary)", color: "white", borderRadius: "50%" } : { color: "var(--cal-text)" }}>
                        {day}
                      </div>
                      {dayEvents.slice(0, 3).map((e) => eventCard(e, true))}
                      {dayEvents.length > 3 && (
                        <div className="text-[9px] pl-1" style={{ color: "var(--cal-mid)" }}>+{dayEvents.length - 3} more</div>
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
        <header className="app-header">
          <div>
            <h1 className="app-company-name">ScheduleMuseAI</h1>
            <h2 className="app-page-name">Calendar</h2>
            <p className="app-subtitle">
              Your full scheduling calendar — day, week, or month view.
            </p>
          </div>
        </header>

        <section className="card p-0 overflow-hidden">
          <div className="cal-grid">
            {/* Header bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3" style={{ borderBottom: "1px solid var(--cal-border)" }}>
              <div className="flex items-center gap-2">
                <button onClick={() => navigate(-1)} className="cal-nav-btn" aria-label="Previous">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                </button>
                <button onClick={goToday} className="cal-view-btn">Today</button>
                <button onClick={() => navigate(1)} className="cal-nav-btn" aria-label="Next">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                </button>
                <span className="text-sm font-semibold" style={{ color: "var(--cal-heading)" }}>{calendarLabel()}</span>
              </div>
              <div className="flex items-center gap-1">
                {(["day", "week", "month"] as const).map((t) => (
                  <button key={t} onClick={() => setRange(t)} className={`cal-view-btn ${range === t ? "cal-view-btn--active" : ""}`}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Calendar body */}
            {loading && <div className="p-12 text-center" style={{ color: "var(--cal-mid)" }}>Loading…</div>}
            {!loading && (
              <>
                {range === "day" && renderDayView()}
                {range === "week" && renderWeekView()}
                {range === "month" && renderMonthView()}
              </>
            )}
          </div>
        </section>

        {/* Event detail drawer */}
        {selectedEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setSelectedEvent(null)}>
            <div className="rounded-xl p-6 shadow-xl w-full max-w-md" style={{ background: "var(--cal-bg)" }} onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-bold mb-1" style={{ color: "var(--cal-heading)" }}>{selectedEvent.meetingType}</h3>
              <div className="space-y-2 text-sm" style={{ color: "var(--cal-text)" }}>
                <p><strong>Guest:</strong> {selectedEvent.guestName} ({selectedEvent.guestEmail})</p>
                <p><strong>When:</strong> {new Date(selectedEvent.startTime).toLocaleString()} – {new Date(selectedEvent.endTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</p>
                <p><strong>Location:</strong> {selectedEvent.location} · {selectedEvent.locationDetails}</p>
                <p><strong>Status:</strong>{" "}
                  <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{ background: (STATUS_COLORS[selectedEvent.status] || STATUS_COLORS.confirmed).bg, color: (STATUS_COLORS[selectedEvent.status] || STATUS_COLORS.confirmed).text }}>
                    {selectedEvent.status}
                  </span>
                </p>
              </div>
              <div className="mt-4 flex justify-end">
                <button onClick={() => setSelectedEvent(null)} className="rounded-lg px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90" style={{ background: "#0d9488", color: "#ffffff" }}>Close</button>
              </div>
            </div>
          </div>
        )}
    </>
  );
}
