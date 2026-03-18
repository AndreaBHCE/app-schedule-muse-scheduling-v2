"use client";

import Link from "next/link";

const navItems = [
  { href: "/dashboard", label: "Dashboard", active: true },
  { href: "/meeting-setup", label: "Booking setup", active: false },
];

export default function DashboardPage() {
  const userName = "there";

  return (
    <div className="app-layout">
      <aside className="app-sidebar" aria-label="Primary navigation">
        <div className="app-sidebar__brand">
          <img src="/schedulemuseai-logo-1-teal.jpg" alt="ScheduleMuse AI logo" />
          <div>
            <h1 className="text-lg font-bold">ScheduleMuse AI</h1>
            <div className="text-sm text-white/70">Subscriber Dashboard</div>
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
            <h2 className="app-title">Welcome back, {userName}.</h2>
            <p className="app-subtitle">
              Your scheduling dashboard gives you full control over booking pages, availability, and reminders — all powered by ScheduleMuse AI.
            </p>
          </div>
          <div className="app-cta">
            <Link href="/meeting-setup" className="btn-primary">
              Create new booking
            </Link>
            <button className="btn-secondary">View analytics</button>
          </div>
        </header>

        <section className="grid gap-6 sm:grid-cols-3">
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-2xl font-bold">24</div>
                <div className="text-xs text-white/70 uppercase tracking-wide">New bookings</div>
              </div>
              <div className="text-teal-400 font-semibold">+18%</div>
            </div>
            <p className="mt-3 text-white/70">
              Keep the rhythm — you’ve got 24 upcoming meetings scheduled this week.
            </p>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-2xl font-bold">5</div>
                <div className="text-xs text-white/70 uppercase tracking-wide">Active booking pages</div>
              </div>
              <div className="text-teal-400 font-semibold">New</div>
            </div>
            <p className="mt-3 text-white/70">
              Each booking page is a self-serve entry point for clients — customize messaging, questions, and branding in seconds.
            </p>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-2xl font-bold">3</div>
                <div className="text-xs text-white/70 uppercase tracking-wide">Reminders set</div>
              </div>
              <div className="text-teal-400 font-semibold">Auto</div>
            </div>
            <p className="mt-3 text-white/70">
              Automatic reminder emails keep no-shows low and meetings high-converting.
            </p>
          </div>
        </section>

        <section className="card">
          <h3 className="card-title">Recent activity</h3>
          <ul className="mt-4 space-y-3">
            <li className="flex justify-between rounded-xl bg-white/10 px-4 py-3 border border-white/10">
              <div>
                <strong>New booking</strong> confirmed
              </div>
              <span className="text-xs text-white/60">Today, 11:30 AM</span>
            </li>
            <li className="flex justify-between rounded-xl bg-white/10 px-4 py-3 border border-white/10">
              <div>
                <strong>Reminder sent</strong> (1 hour before)
              </div>
              <span className="text-xs text-white/60">Today, 10:30 AM</span>
            </li>
            <li className="flex justify-between rounded-xl bg-white/10 px-4 py-3 border border-white/10">
              <div>
                <strong>Booking page updated</strong> (availability)
              </div>
              <span className="text-xs text-white/60">Yesterday, 4:20 PM</span>
            </li>
            <li className="flex justify-between rounded-xl bg-white/10 px-4 py-3 border border-white/10">
              <div>
                <strong>New booking</strong> confirmed
              </div>
              <span className="text-xs text-white/60">Yesterday, 3:10 PM</span>
            </li>
          </ul>
        </section>
      </main>
    </div>
  );
}
