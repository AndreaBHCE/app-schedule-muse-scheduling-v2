"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", active: true },
  { href: "/meeting-setup", label: "Booking setup", active: false },
  { href: "/your-bookings", label: "Your bookings", active: false },
];

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

export default function DashboardPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [events, setEvents] = useState<MeetingEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [range, setRange] = useState("day");

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
        const response = await fetch(`/api/events?range=${range}`);
        if (!response.ok) throw new Error("Failed to load upcoming meetings");
        const json = await response.json();
        if (!canceled) {
          setEvents(json.events || []);
          setEventsError(null);
        }
      } catch (err) {
        if (!canceled) setEventsError((err as Error).message);
      } finally {
        if (!canceled) setEventsLoading(false);
      }
    }

    loadEvents();
    return () => {
      canceled = true;
    };
  }, [range]);

  return (
    <div className="app-layout">
      <aside className="app-sidebar" aria-label="Primary navigation">
        <div className="app-sidebar__brand">
          <img src="/schedulemuseai-logo-transparent-01.png" alt="ScheduleMuse AI logo" />
        </div>

        <nav className="app-sidebar__nav" aria-label="Secondary navigation">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`app-sidebar__link ${item.active ? "app-sidebar__link--active" : ""}`}
            >
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="text-xs text-white/70">
          Version 1.0 • 2027
          <div className="mt-2">
            Need help? <a className="underline" href="#">Support</a>
          </div>
          <div className="mt-4">
            <div className="text-sm text-white/70">Signed in as: you</div>
          </div>
        </div>
      </aside>

      <main className="app-main">
        <header className="app-header">
          <div>
            <h2 className="app-title">Welcome back.</h2>
            <p className="app-subtitle">
              Your scheduling dashboard gives you full control over booking pages, availability, and reminders — all powered by ScheduleMuse AI.
            </p>
          </div>
          <div className="app-cta">
            <Link href="/meeting-setup" className="btn-primary">
              Create booking page
            </Link>
            <button className="btn-secondary">View analytics</button>
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
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="card">
          <h3 className="card-title">Your Bookings</h3>
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
          <h3 className="card-title">My Upcoming Meetings</h3>
          <div className="mt-3 flex gap-2">
            {(["day", "week", "month"] as const).map((target) => (
              <button
                key={target}
                onClick={() => setRange(target)}
                className={`rounded px-3 py-1 text-xs font-semibold ${range === target ? "bg-emerald-500 text-slate-900" : "bg-slate-700 text-white"}`}
              >
                {target === "day" ? "Day" : target === "week" ? "7 Days" : "Month"}
              </button>
            ))}
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[2fr,1fr]">
            <div>
              {eventsLoading && <p className="text-white/70">Loading meetings...</p>}
              {eventsError && <p className="text-rose-300">{eventsError}</p>}
              {!eventsLoading && !eventsError && events.length === 0 && (
                <p className="text-white/70">No upcoming meetings found for this range.</p>
              )}

              {!eventsLoading && !eventsError && events.length > 0 && (
                <div className="bg-slate-800 rounded-xl p-3">
                  <div className="grid grid-cols-[100px,1fr] gap-2 text-xs text-slate-300 mb-2">
                    <div className="font-semibold">Time</div>
                    <div className="font-semibold">Event</div>
                  </div>
                  {events.map((event) => {
                    const eventDate = new Date(event.startTime);
                    const timeStr = eventDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                    return (
                      <div key={event.id} className="grid grid-cols-[100px,1fr] gap-2 border-y border-slate-700 py-2">
                        <div className="text-white/70">{timeStr}</div>
                        <div>
                          <div className="font-semibold text-white">{event.meetingType}</div>
                          <div className="text-xs text-white/60">{event.guestName} ({event.guestEmail})</div>
                          <div className="text-xs text-white/60">{event.location} • {event.status}</div>
                          <div className="mt-1 flex flex-wrap gap-1">
                            <button onClick={() => alert(`Reschedule ${event.meetingType}`)} className="rounded px-2 py-1 text-xs bg-slate-700 text-white">Reschedule</button>
                            <button onClick={() => alert(`Cancel ${event.meetingType}`)} className="rounded px-2 py-1 text-xs bg-slate-700 text-white">Cancel</button>
                            {event.location === "virtual" && <a href={event.locationDetails} target="_blank" rel="noreferrer" className="rounded px-2 py-1 text-xs bg-slate-700 text-white">Join</a>}
                            <button onClick={() => alert(`Details for ${event.meetingType}`)} className="rounded px-2 py-1 text-xs bg-slate-700 text-white">Details</button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <aside className="card bg-slate-900 p-4 border border-slate-700">
              <h4 className="text-base font-semibold text-white">Right panel (coming soon)</h4>
              <p className="mt-2 text-sm text-white/70">Place KPI cards, scheduling shortcuts, and quick actions here once the full layout solidifies.</p>
            </aside>
          </div>
        </section>

      </main>
    </div>
  );
}
