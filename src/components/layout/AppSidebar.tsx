"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard",     label: "Dashboard" },
  { href: "/meeting-setup", label: "Booking Calendars" },
  { href: "/your-meetings", label: "Your Meetings" },
  { href: "/calendar",      label: "Calendar" },
  { href: "/contacts",      label: "Contacts" },
  { href: "/integrations",  label: "Integrations" },
  { href: "/analytics",     label: "Analytics" },
  { href: "/developers",    label: "API/Webhook" },
];

export default function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="app-sidebar" aria-label="Primary navigation">
      <div className="app-sidebar__brand">
        <img src="/schedulemuseai-logo-transparent-01.png" alt="ScheduleMuse AI logo" />
      </div>

      <nav className="app-sidebar__nav" aria-label="Main navigation">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`app-sidebar__link ${isActive ? "app-sidebar__link--active" : ""}`}
            >
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <footer className="app-sidebar__footer">
        <div className="app-sidebar__footer-links">
          <Link href="/support" className="app-sidebar__footer-link">Support</Link>
          <span className="app-sidebar__footer-sep">·</span>
          <Link href="/docs" className="app-sidebar__footer-link">Docs</Link>
          <span className="app-sidebar__footer-sep">·</span>
          <Link href="/privacy" className="app-sidebar__footer-link">Privacy</Link>
          <span className="app-sidebar__footer-sep">·</span>
          <Link href="/terms-of-use" className="app-sidebar__footer-link">Terms</Link>
        </div>
        <p className="app-sidebar__copyright">
          © 2026 Live Laugh Sail Media Production LLC.<br />for ScheduleMuse AI
        </p>
        <p className="app-sidebar__version">v1.0</p>
      </footer>
    </aside>
  );
}
