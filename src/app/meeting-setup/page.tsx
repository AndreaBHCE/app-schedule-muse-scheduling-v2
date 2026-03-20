"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", active: false },
  { href: "/meeting-setup", label: "Booking setup", active: true },
];

export default function MeetingSetupPage() {
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState(30);
  const [buffer, setBuffer] = useState(0);
  const [status, setStatus] = useState<string | null>(null);

  const canSubmit = useMemo(() => title.trim().length > 0 && duration > 0 && buffer >= 0, [title, duration, buffer]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();

    if (!canSubmit) {
      setStatus("Please fill in all fields correctly.");
      return;
    }

    const response = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim(), durationMinutes: duration, bufferMinutes: buffer }),
    });

    if (!response.ok) {
      const json = await response.json();
      setStatus(`Failed to create booking: ${json.error || response.statusText}`);
      return;
    }

    setTitle("");
    setDuration(30);
    setBuffer(0);
    setStatus("Booking created successfully.");
  }

  return (
    <div className="app-layout">
      <aside className="app-sidebar" aria-label="Primary navigation">
        <div className="app-sidebar__brand">
          <img src="/schedulemuseai-logo-transparent-01.png" alt="ScheduleMuse AI logo" />
        </div>

        <nav className="app-sidebar__nav" aria-label="Secondary navigation">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className={`app-sidebar__link ${item.active ? "app-sidebar__link--active" : ""}`}>
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
            <h2 className="app-title">Create Booking Page</h2>
            <p className="app-subtitle">Set up a new meeting to publish to your scheduling page.</p>
          </div>
          <div className="app-cta">
            <Link href="/dashboard" className="btn-secondary">
              ← Back to dashboard
            </Link>
          </div>
        </header>

        <section className="card">
          <form className="space-y-4" onSubmit={onSubmit}>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Meeting title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50"
                placeholder="E.g. 30-minute strategy session"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Duration (minutes)</label>
                <input
                  type="number"
                  min={1}
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Buffer (minutes)</label>
                <input
                  type="number"
                  min={0}
                  value={buffer}
                  onChange={(e) => setBuffer(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                />
              </div>
            </div>

            {status && <div className="text-sm text-teal-300">{status}</div>}

            <button type="submit" disabled={!canSubmit} className="btn-primary">
              Create booking
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
