"use client";

import Link from "next/link";

const navItems = [
  { href: "/dashboard", label: "Dashboard", active: false },
  { href: "/meeting-setup", label: "Booking setup", active: true },
];

export default function MeetingSetupPage() {
  const userName = "there";

  return (
    <div className="app-layout">
      <aside className="app-sidebar" aria-label="Primary navigation">
        <div className="app-sidebar__brand">
          <img src="/schedulemuseai-logo-teal.jpg" alt="ScheduleMuse AI logo" />
          <div>
            <h1 className="text-lg font-bold">ScheduleMuse AI</h1>
            <div className="text-sm text-white/70">Booking page builder</div>
          </div>
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
            <h2 className="app-title">Booking page builder</h2>
            <p className="app-subtitle">
              Fine-tune your booking flow with modular settings, forms, reminders, and styling.
            </p>
          </div>
          <div className="app-cta">
            <Link href="/dashboard" className="btn-secondary">
              ← Back to dashboard
            </Link>
            <button className="btn-primary">Publish changes</button>
          </div>
        </header>

        <section className="card">
          <h3 className="card-title">Meeting basics</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Meeting subject
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50"
                placeholder="e.g. 30-minute strategy session"
                defaultValue="Meeting with Andrea from ScheduleMuse AI"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Duration
                </label>
                <select className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white">
                  <option>15 minutes</option>
                  <option selected>30 minutes</option>
                  <option>45 minutes</option>
                  <option>60 minutes</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Buffer
                </label>
                <select className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white">
                  <option>0 minutes</option>
                  <option>10 minutes</option>
                  <option>15 minutes</option>
                  <option>30 minutes</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        <section className="card">
          <h3 className="card-title">Availability</h3>
          <div className="space-y-4">
            <label className="flex items-center space-x-3">
              <input type="checkbox" defaultChecked className="rounded" />
              <span className="text-white/70">Show availability calendar</span>
            </label>
            <p className="text-white/70 text-sm">
              Use your connected calendars to surface only real free time. Turning this off hides the page from your public link.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}