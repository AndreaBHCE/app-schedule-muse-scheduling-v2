"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import UserProfile from "@/components/layout/UserProfile";

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

      <div className="app-sidebar__user">
        <UserProfile />
      </div>
    </aside>
  );
}
