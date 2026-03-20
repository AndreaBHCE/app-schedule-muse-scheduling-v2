"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", active: true },
  { href: "/meeting-setup", label: "Booking setup", active: false },
];

type Booking = {
  id: string;
  title: string;
  durationMinutes: number;
  bufferMinutes: number;
  createdAt: string;
};

export default function DashboardPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          <h3 className="card-title">Your booking pages</h3>

          {loading && <p className="text-white/70">Loading...</p>}
          {error && <p className="text-rose-300">{error}</p>}

          {!loading && !error && bookings.length === 0 && (
            <p className="text-white/70">No bookings yet. Create one with the button above.</p>
          )}

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {bookings.map((booking) => (
              <article key={booking.id} className="card bg-slate-900 p-4">
                <h4 className="text-lg font-semibold text-white">{booking.title}</h4>
                <p className="text-sm text-white/70">Duration: {booking.durationMinutes}m</p>
                <p className="text-sm text-white/70">Buffer: {booking.bufferMinutes}m</p>
                <p className="text-xs text-white/50">Created: {new Date(booking.createdAt).toLocaleString()}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
