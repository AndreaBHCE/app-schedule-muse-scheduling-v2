"use client";

import Link from "next/link";
import React, { useCallback, useState } from "react";

/* ================================================================
   TYPES
   ================================================================ */

type WeekDay = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

type DayHours = { enabled: boolean; start: string; end: string };

type LocationType = "video" | "phone" | "in-person";

type FormField = {
  id: string;
  label: string;
  type: "text" | "textarea" | "single-select" | "multi-select" | "phone" | "file";
  required: boolean;
  options?: string[];
  isDefault?: boolean;
};

type NotificationEvent = "scheduled" | "reminder" | "rescheduled" | "reassigned" | "canceled";

type NotificationConfig = {
  event: NotificationEvent;
  emailEnabled: boolean;
  smsEnabled: boolean;
  reminderMinutes?: number;
};

type TabId = "settings" | "form" | "notifications" | "page" | "embed" | "phone";

type BookingConfig = {
  /* Tab 1 — Booking Settings */
  meetingSubject: string;
  durations: number[];
  defaultDuration: number;
  hostName: string;
  hostEmail: string;
  availability: Record<WeekDay, DayHours>;
  timezone: string;
  location: { type: LocationType; details: string };
  sessionType: "one-on-one" | "group" | "concurrent";
  groupMaxSize: number;
  minNoticeHours: number;
  maxAdvanceDays: number;
  slotIntervalMinutes: number;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  paymentEnabled: boolean;
  paymentAmount: number;
  paymentCurrency: string;
  /* Tab 2 — Booking Form (NO location here) */
  formFields: FormField[];
  afterBookingRedirect: string;
  /* Tab 3 — Notifications */
  notifications: NotificationConfig[];
  /* Tab 4 — Page Designer */
  pageSlug: string;
  pageBackground: string;
  pageLogo: string;
  pageHeading: string;
  pageAccentColor: string;
  /* Tab 5 — Embed Designer */
  embedMode: "inline" | "lightbox";
  embedButtonText: string;
  embedButtonColor: string;
  /* Tab 6 — Phone Settings */
  phoneNumber: string;
  phoneWelcomeMessage: string;
};

/* ================================================================
   CONSTANTS
   ================================================================ */

const WEEK_DAYS: WeekDay[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

const DAY_LABELS: Record<WeekDay, string> = {
  monday: "Monday", tuesday: "Tuesday", wednesday: "Wednesday",
  thursday: "Thursday", friday: "Friday", saturday: "Saturday", sunday: "Sunday",
};

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "settings",      label: "Booking Settings", icon: "⚙️" },
  { id: "form",          label: "Booking Form",     icon: "📋" },
  { id: "notifications", label: "Notifications",    icon: "🔔" },
  { id: "page",          label: "Page Designer",    icon: "🎨" },
  { id: "embed",         label: "Embed Designer",   icon: "🖥️" },
  { id: "phone",         label: "Phone Settings",   icon: "📞" },
];

const navItems = [
  { href: "/dashboard",     label: "Dashboard",      active: false },
  { href: "/meeting-setup", label: "Booking setup",  active: true },
  { href: "/your-bookings", label: "Your bookings",  active: false },
];

const DURATION_PRESETS = [15, 30, 45, 60, 90, 120];
const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD"];

const REMINDER_OPTIONS = [
  { label: "15 min before",  value: 15 },
  { label: "30 min before",  value: 30 },
  { label: "1 hour before",  value: 60 },
  { label: "2 hours before", value: 120 },
  { label: "24 hours before", value: 1440 },
];

const NOTIFICATION_LABELS: Record<NotificationEvent, { title: string; desc: string }> = {
  scheduled:   { title: "Booking Scheduled",  desc: "Sent when a guest books a meeting" },
  reminder:    { title: "Reminder",           desc: "Sent before the meeting starts" },
  rescheduled: { title: "Rescheduled",        desc: "Sent when a meeting is rescheduled" },
  reassigned:  { title: "Reassigned",         desc: "Sent when a meeting is reassigned to another host" },
  canceled:    { title: "Canceled",           desc: "Sent when a meeting is canceled" },
};

const LOCATION_LABELS: Record<LocationType, string> = {
  video: "Video call", phone: "Phone call", "in-person": "In-person",
};

function defaultConfig(): BookingConfig {
  return {
    meetingSubject: "Meeting with John Smith from Acme Builders",
    durations: [30],
    defaultDuration: 30,
    hostName: "",
    hostEmail: "",
    availability: {
      monday:    { enabled: true,  start: "09:00", end: "17:00" },
      tuesday:   { enabled: true,  start: "09:00", end: "17:00" },
      wednesday: { enabled: true,  start: "09:00", end: "17:00" },
      thursday:  { enabled: true,  start: "09:00", end: "17:00" },
      friday:    { enabled: true,  start: "09:00", end: "17:00" },
      saturday:  { enabled: false, start: "09:00", end: "17:00" },
      sunday:    { enabled: false, start: "09:00", end: "17:00" },
    },
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    location: { type: "video", details: "" },
    sessionType: "one-on-one",
    groupMaxSize: 10,
    minNoticeHours: 2,
    maxAdvanceDays: 60,
    slotIntervalMinutes: 15,
    bufferBeforeMinutes: 0,
    bufferAfterMinutes: 5,
    paymentEnabled: false,
    paymentAmount: 0,
    paymentCurrency: "USD",
    formFields: [
      { id: "first_name", label: "First Name", type: "text", required: true, isDefault: true },
      { id: "last_name",  label: "Last Name",  type: "text", required: true, isDefault: true },
      { id: "email",      label: "Email",      type: "text", required: true, isDefault: true },
    ],
    afterBookingRedirect: "",
    notifications: [
      { event: "scheduled",   emailEnabled: true,  smsEnabled: false },
      { event: "reminder",    emailEnabled: true,  smsEnabled: false, reminderMinutes: 60 },
      { event: "rescheduled", emailEnabled: true,  smsEnabled: false },
      { event: "reassigned",  emailEnabled: true,  smsEnabled: false },
      { event: "canceled",    emailEnabled: true,  smsEnabled: false },
    ],
    pageSlug: "my-booking",
    pageBackground: "#ffffff",
    pageLogo: "",
    pageHeading: "Schedule a meeting",
    pageAccentColor: "#00bfa5",
    embedMode: "inline",
    embedButtonText: "Book a meeting",
    embedButtonColor: "#00bfa5",
    phoneNumber: "",
    phoneWelcomeMessage: "Thanks for calling! Please book a meeting at your convenience.",
  };
}

/* ================================================================
   REUSABLE PRIMITIVES
   ================================================================ */

function ChevronDown({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-4 w-4 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
      style={{ color: "var(--cal-mid)" }}
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
    </svg>
  );
}

function Section({
  label, summary, expanded, onToggle, children,
}: {
  label: string;
  summary: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div style={{ borderBottom: "1px solid var(--cal-border)" }}>
      <button
        type="button"
        onClick={onToggle}
        className="setup-section-btn w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
        style={{ background: expanded ? "var(--cal-hover)" : undefined }}
      >
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--cal-mid)" }}>
            {label}
          </div>
          {!expanded && (
            <div className="text-sm mt-0.5 truncate" style={{ color: "var(--cal-heading)" }}>
              {summary}
            </div>
          )}
        </div>
        <ChevronDown open={expanded} />
      </button>
      {expanded && <div className="px-5 pb-5 pt-1">{children}</div>}
    </div>
  );
}

function Input({ className = "", style, ...rest }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...rest}
      className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:ring-2 ${className}`}
      style={{
        borderColor: "var(--cal-border)",
        color: "var(--cal-heading)",
        background: "white",
        "--tw-ring-color": "oklch(0.618 0.182 180 / 0.2)",
        ...style,
      } as React.CSSProperties}
    />
  );
}

function Select({ className = "", style, children, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...rest}
      className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${className}`}
      style={{
        borderColor: "var(--cal-border)",
        color: "var(--cal-heading)",
        background: "white",
        ...style,
      }}
    >
      {children}
    </select>
  );
}

function Toggle({ enabled, onChange, label }: { enabled: boolean; onChange: (val: boolean) => void; label?: string }) {
  return (
    <button type="button" onClick={() => onChange(!enabled)} className="flex items-center gap-2">
      <div
        className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200"
        style={{ background: enabled ? "var(--cal-primary)" : "var(--cal-border)" }}
      >
        <span
          className="inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform duration-200"
          style={{ transform: enabled ? "translateX(18px)" : "translateX(3px)" }}
        />
      </div>
      {label && <span className="text-sm" style={{ color: "var(--cal-text)" }}>{label}</span>}
    </button>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--cal-mid)" }}>
      {children}
    </label>
  );
}

/* ================================================================
   MAIN COMPONENT
   ================================================================ */

export default function MeetingSetupPage() {
  const [config, setConfig] = useState<BookingConfig>(defaultConfig);
  const [activeTab, setActiveTab] = useState<TabId>("settings");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const update = useCallback(<K extends keyof BookingConfig>(key: K, value: BookingConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }, []);

  function toggle(section: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  }

  const isOpen = (s: string) => expanded.has(s);

  async function handleSave() {
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: config.meetingSubject,
          durationMinutes: config.defaultDuration,
          bufferMinutes: config.bufferAfterMinutes,
          config,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setSaveMsg("Booking page saved successfully.");
    } catch {
      setSaveMsg("Error saving — please try again.");
    } finally {
      setSaving(false);
    }
  }

  /* ================================================================
     TAB 1 — BOOKING SETTINGS  (9 inline-edit sections)
     ================================================================ */
  function renderBookingSettings() {
    const enabledDays = WEEK_DAYS.filter((d) => config.availability[d].enabled);
    const availSummary =
      enabledDays.length === 0
        ? "No availability set"
        : `${enabledDays.map((d) => DAY_LABELS[d].slice(0, 3)).join(", ")} · ${config.availability[enabledDays[0]].start} – ${config.availability[enabledDays[0]].end}`;

    const locSummary = `${LOCATION_LABELS[config.location.type]}${config.location.details ? ` · ${config.location.details}` : ""}`;

    return (
      <div>
        {/* ---- Meeting Subject ---- */}
        <Section label="Meeting Subject" summary={config.meetingSubject} expanded={isOpen("subject")} onToggle={() => toggle("subject")}>
          <FieldLabel>Subject line</FieldLabel>
          <Input value={config.meetingSubject} onChange={(e) => update("meetingSubject", e.target.value)} placeholder="Meeting with John Smith from Acme Builders" />
        </Section>

        {/* ---- Duration ---- */}
        <Section
          label="Duration"
          summary={config.durations.map((d) => `${d} min`).join(", ")}
          expanded={isOpen("duration")}
          onToggle={() => toggle("duration")}
        >
          <FieldLabel>Offer up to 4 duration options</FieldLabel>
          <div className="flex flex-wrap gap-2 mt-2">
            {DURATION_PRESETS.map((d) => {
              const on = config.durations.includes(d);
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => {
                    if (on) {
                      if (config.durations.length > 1) {
                        const next = config.durations.filter((x) => x !== d);
                        update("durations", next);
                        if (config.defaultDuration === d) update("defaultDuration", next[0]);
                      }
                    } else if (config.durations.length < 4) {
                      update("durations", [...config.durations, d].sort((a, b) => a - b));
                    }
                  }}
                  className="rounded-full px-4 py-1.5 text-sm font-semibold border transition-colors"
                  style={{
                    background: on ? "var(--cal-primary)" : "white",
                    color: on ? "white" : "var(--cal-heading)",
                    borderColor: on ? "var(--cal-primary)" : "var(--cal-border)",
                  }}
                >
                  {d} min
                </button>
              );
            })}
          </div>
          {config.durations.length > 1 && (
            <div className="mt-3">
              <FieldLabel>Default duration</FieldLabel>
              <Select value={config.defaultDuration} onChange={(e) => update("defaultDuration", Number(e.target.value))}>
                {config.durations.map((d) => (
                  <option key={d} value={d}>{d} min</option>
                ))}
              </Select>
            </div>
          )}
        </Section>

        {/* ---- Host ---- */}
        <Section
          label="Host"
          summary={config.hostName ? `${config.hostName} <${config.hostEmail}>` : "Not configured"}
          expanded={isOpen("host")}
          onToggle={() => toggle("host")}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <FieldLabel>Name</FieldLabel>
              <Input value={config.hostName} onChange={(e) => update("hostName", e.target.value)} placeholder="Your name" />
            </div>
            <div>
              <FieldLabel>Email</FieldLabel>
              <Input type="email" value={config.hostEmail} onChange={(e) => update("hostEmail", e.target.value)} placeholder="you@example.com" />
            </div>
          </div>
        </Section>

        {/* ---- Availability ---- */}
        <Section label="Availability" summary={availSummary} expanded={isOpen("availability")} onToggle={() => toggle("availability")}>
          <div className="mb-3">
            <FieldLabel>Timezone</FieldLabel>
            <Input value={config.timezone} onChange={(e) => update("timezone", e.target.value)} />
          </div>
          <FieldLabel>Weekly hours</FieldLabel>
          <div className="space-y-2 mt-2">
            {WEEK_DAYS.map((day) => {
              const dh = config.availability[day];
              return (
                <div key={day} className="flex items-center gap-3">
                  <Toggle
                    enabled={dh.enabled}
                    onChange={(val) =>
                      update("availability", { ...config.availability, [day]: { ...dh, enabled: val } })
                    }
                  />
                  <span
                    className="w-20 text-sm font-medium"
                    style={{ color: dh.enabled ? "var(--cal-heading)" : "var(--cal-border)" }}
                  >
                    {DAY_LABELS[day]}
                  </span>
                  {dh.enabled && (
                    <>
                      <input
                        type="time"
                        value={dh.start}
                        onChange={(e) =>
                          update("availability", { ...config.availability, [day]: { ...dh, start: e.target.value } })
                        }
                        className="rounded border px-2 py-1 text-sm"
                        style={{ borderColor: "var(--cal-border)", color: "var(--cal-heading)" }}
                      />
                      <span style={{ color: "var(--cal-mid)" }}>–</span>
                      <input
                        type="time"
                        value={dh.end}
                        onChange={(e) =>
                          update("availability", { ...config.availability, [day]: { ...dh, end: e.target.value } })
                        }
                        className="rounded border px-2 py-1 text-sm"
                        style={{ borderColor: "var(--cal-border)", color: "var(--cal-heading)" }}
                      />
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </Section>

        {/* ---- Location (SINGLE — no multi-location anywhere) ---- */}
        <Section label="Location" summary={locSummary} expanded={isOpen("location")} onToggle={() => toggle("location")}>
          <FieldLabel>Meeting location</FieldLabel>
          <div className="flex gap-2 mt-1">
            {(["video", "phone", "in-person"] as LocationType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => update("location", { ...config.location, type })}
                className="rounded-lg px-4 py-2 text-sm font-semibold border transition-colors"
                style={{
                  background: config.location.type === type ? "var(--cal-primary)" : "white",
                  color: config.location.type === type ? "white" : "var(--cal-heading)",
                  borderColor: config.location.type === type ? "var(--cal-primary)" : "var(--cal-border)",
                }}
              >
                {LOCATION_LABELS[type]}
              </button>
            ))}
          </div>
          <div className="mt-3">
            <FieldLabel>
              {config.location.type === "video"
                ? "Meeting link (Zoom, Google Meet, etc.)"
                : config.location.type === "phone"
                  ? "Phone number"
                  : "Address"}
            </FieldLabel>
            <Input
              value={config.location.details}
              onChange={(e) => update("location", { ...config.location, details: e.target.value })}
              placeholder={
                config.location.type === "video"
                  ? "https://zoom.us/j/..."
                  : config.location.type === "phone"
                    ? "+1 (555) 123-4567"
                    : "123 Main St, Suite 100"
              }
            />
          </div>
        </Section>

        {/* ---- Session Type ---- */}
        <Section
          label="Session Type"
          summary={
            config.sessionType === "one-on-one"
              ? "One-on-one"
              : config.sessionType === "group"
                ? `Group (up to ${config.groupMaxSize})`
                : "Concurrent"
          }
          expanded={isOpen("session")}
          onToggle={() => toggle("session")}
        >
          <div className="space-y-2">
            {([
              ["one-on-one",  "One-on-one",  "Each timeslot is booked by one guest"],
              ["group",       "Group",       "Multiple guests share the same timeslot"],
              ["concurrent",  "Concurrent",  "Multiple separate meetings can run at the same time"],
            ] as const).map(([value, title, desc]) => (
              <label
                key={value}
                className="flex items-start gap-3 cursor-pointer rounded-lg border p-3 transition-colors"
                style={{
                  borderColor: config.sessionType === value ? "var(--cal-primary)" : "var(--cal-border)",
                  background: config.sessionType === value ? "var(--cal-hover)" : "white",
                }}
              >
                <input type="radio" name="sessionType" checked={config.sessionType === value} onChange={() => update("sessionType", value)} className="mt-0.5 accent-teal-600" />
                <div>
                  <div className="text-sm font-semibold" style={{ color: "var(--cal-heading)" }}>{title}</div>
                  <div className="text-xs" style={{ color: "var(--cal-mid)" }}>{desc}</div>
                </div>
              </label>
            ))}
          </div>
          {config.sessionType === "group" && (
            <div className="mt-3">
              <FieldLabel>Max group size</FieldLabel>
              <Input type="number" min={2} max={100} value={config.groupMaxSize} onChange={(e) => update("groupMaxSize", Number(e.target.value))} />
            </div>
          )}
        </Section>

        {/* ---- Scheduling Window ---- */}
        <Section
          label="Scheduling Window"
          summary={`${config.minNoticeHours}h notice · up to ${config.maxAdvanceDays} days ahead`}
          expanded={isOpen("window")}
          onToggle={() => toggle("window")}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <FieldLabel>Minimum notice (hours)</FieldLabel>
              <Input type="number" min={0} value={config.minNoticeHours} onChange={(e) => update("minNoticeHours", Number(e.target.value))} />
            </div>
            <div>
              <FieldLabel>How far ahead (days)</FieldLabel>
              <Input type="number" min={1} value={config.maxAdvanceDays} onChange={(e) => update("maxAdvanceDays", Number(e.target.value))} />
            </div>
          </div>
        </Section>

        {/* ---- Buffer & Intervals ---- */}
        <Section
          label="Buffer & Intervals"
          summary={`${config.slotIntervalMinutes} min slots · ${config.bufferBeforeMinutes}/${config.bufferAfterMinutes} min buffer`}
          expanded={isOpen("buffer")}
          onToggle={() => toggle("buffer")}
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <FieldLabel>Slot interval (min)</FieldLabel>
              <Select value={config.slotIntervalMinutes} onChange={(e) => update("slotIntervalMinutes", Number(e.target.value))}>
                {[5, 10, 15, 20, 30, 60].map((v) => (
                  <option key={v} value={v}>{v} min</option>
                ))}
              </Select>
            </div>
            <div>
              <FieldLabel>Buffer before (min)</FieldLabel>
              <Input type="number" min={0} value={config.bufferBeforeMinutes} onChange={(e) => update("bufferBeforeMinutes", Number(e.target.value))} />
            </div>
            <div>
              <FieldLabel>Buffer after (min)</FieldLabel>
              <Input type="number" min={0} value={config.bufferAfterMinutes} onChange={(e) => update("bufferAfterMinutes", Number(e.target.value))} />
            </div>
          </div>
        </Section>

        {/* ---- Payment ---- */}
        <Section
          label="Payment"
          summary={config.paymentEnabled ? `${config.paymentCurrency} ${config.paymentAmount.toFixed(2)}` : "Disabled"}
          expanded={isOpen("payment")}
          onToggle={() => toggle("payment")}
        >
          <Toggle enabled={config.paymentEnabled} onChange={(val) => update("paymentEnabled", val)} label="Require payment to book" />
          {config.paymentEnabled && (
            <div className="grid gap-3 sm:grid-cols-2 mt-3">
              <div>
                <FieldLabel>Amount</FieldLabel>
                <Input type="number" min={0} step={0.01} value={config.paymentAmount} onChange={(e) => update("paymentAmount", Number(e.target.value))} />
              </div>
              <div>
                <FieldLabel>Currency</FieldLabel>
                <Select value={config.paymentCurrency} onChange={(e) => update("paymentCurrency", e.target.value)}>
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </Select>
              </div>
            </div>
          )}
        </Section>
      </div>
    );
  }

  /* ================================================================
     TAB 2 — BOOKING FORM  (fields + after-booking, NO location)
     ================================================================ */
  function renderBookingForm() {
    function addField() {
      const id = `custom_${Date.now()}`;
      update("formFields", [...config.formFields, { id, label: "", type: "text", required: false }]);
    }

    function removeField(id: string) {
      update("formFields", config.formFields.filter((f) => f.id !== id));
    }

    function updateField(id: string, patch: Partial<FormField>) {
      update("formFields", config.formFields.map((f) => (f.id === id ? { ...f, ...patch } : f)));
    }

    function moveField(id: string, direction: -1 | 1) {
      const fields = [...config.formFields];
      const idx = fields.findIndex((f) => f.id === id);
      const newIdx = idx + direction;
      if (newIdx < 0 || newIdx >= fields.length) return;
      [fields[idx], fields[newIdx]] = [fields[newIdx], fields[idx]];
      update("formFields", fields);
    }

    return (
      <div className="p-5 space-y-6">
        {/* Form fields */}
        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: "var(--cal-heading)" }}>
            Form fields
          </h4>
          <div className="space-y-3">
            {config.formFields.map((field, idx) => (
              <div
                key={field.id}
                className="rounded-lg border p-4"
                style={{ borderColor: "var(--cal-border)", background: "white" }}
              >
                <div className="flex items-start gap-3">
                  {/* Reorder arrows (custom fields only) */}
                  {!field.isDefault && (
                    <div className="flex flex-col gap-0.5 pt-5">
                      <button
                        type="button"
                        onClick={() => moveField(field.id, -1)}
                        disabled={idx === 0}
                        className="text-xs disabled:opacity-20"
                        style={{ color: "var(--cal-mid)" }}
                        title="Move up"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => moveField(field.id, 1)}
                        disabled={idx === config.formFields.length - 1}
                        className="text-xs disabled:opacity-20"
                        style={{ color: "var(--cal-mid)" }}
                        title="Move down"
                      >
                        ▼
                      </button>
                    </div>
                  )}

                  <div className="flex-1 grid gap-3 sm:grid-cols-[1fr,140px]">
                    <div>
                      <FieldLabel>Field label</FieldLabel>
                      <Input
                        value={field.label}
                        onChange={(e) => updateField(field.id, { label: e.target.value })}
                        placeholder="Question text"
                        disabled={field.isDefault}
                      />
                    </div>
                    <div>
                      <FieldLabel>Type of field</FieldLabel>
                      <Select
                        value={field.type}
                        onChange={(e) => updateField(field.id, { type: e.target.value as FormField["type"] })}
                        disabled={field.isDefault}
                      >
                        <option value="text">Short text</option>
                        <option value="textarea">Long text</option>
                        <option value="single-select">Single select</option>
                        <option value="multi-select">Multi select</option>
                        <option value="phone">Phone</option>
                        <option value="file">File upload</option>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 pt-5">
                    <Toggle
                      enabled={field.required}
                      onChange={(val) => updateField(field.id, { required: val })}
                      label="Required"
                    />
                    {!field.isDefault && (
                      <button
                        type="button"
                        onClick={() => removeField(field.id)}
                        className="text-rose-500 hover:text-rose-700 text-lg font-bold px-1"
                        title="Remove field"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>

                {/* Options editor for select types */}
                {(field.type === "single-select" || field.type === "multi-select") && !field.isDefault && (
                  <div className="mt-3">
                    <FieldLabel>Options (one per line)</FieldLabel>
                    <textarea
                      value={(field.options || []).join("\n")}
                      onChange={(e) => updateField(field.id, { options: e.target.value.split("\n") })}
                      rows={3}
                      className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                      style={{ borderColor: "var(--cal-border)", color: "var(--cal-heading)" }}
                      placeholder={"Option 1\nOption 2\nOption 3"}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addField}
            className="mt-3 rounded-lg border-2 border-dashed w-full px-4 py-3 text-sm font-semibold transition-colors"
            style={{ borderColor: "var(--cal-btn)", color: "var(--cal-primary)" }}
          >
            + Add custom question
          </button>
        </div>

        {/* After Booking */}
        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: "var(--cal-heading)" }}>
            After booking
          </h4>
          <div className="rounded-lg border p-4" style={{ borderColor: "var(--cal-border)", background: "white" }}>
            <FieldLabel>Redirect URL (optional)</FieldLabel>
            <Input
              value={config.afterBookingRedirect}
              onChange={(e) => update("afterBookingRedirect", e.target.value)}
              placeholder="https://yoursite.com/thank-you"
            />
            <p className="text-xs mt-1.5" style={{ color: "var(--cal-mid)" }}>
              Leave empty to show the default confirmation page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ================================================================
     TAB 3 — NOTIFICATIONS
     ================================================================ */
  function renderNotifications() {
    function updateNotification(event: NotificationEvent, patch: Partial<NotificationConfig>) {
      update("notifications", config.notifications.map((n) => (n.event === event ? { ...n, ...patch } : n)));
    }

    return (
      <div className="p-5 space-y-3">
        <p className="text-sm mb-4" style={{ color: "var(--cal-text)" }}>
          Configure which notifications are sent to guests for each booking event.
        </p>
        {config.notifications.map((notif) => {
          const meta = NOTIFICATION_LABELS[notif.event];
          return (
            <div
              key={notif.event}
              className="rounded-lg border p-4"
              style={{ borderColor: "var(--cal-border)", background: "white" }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-bold" style={{ color: "var(--cal-heading)" }}>{meta.title}</div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--cal-mid)" }}>{meta.desc}</div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <Toggle enabled={notif.emailEnabled} onChange={(val) => updateNotification(notif.event, { emailEnabled: val })} label="Email" />
                  <Toggle enabled={notif.smsEnabled} onChange={(val) => updateNotification(notif.event, { smsEnabled: val })} label="SMS" />
                </div>
              </div>
              {notif.event === "reminder" && (
                <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--cal-border)" }}>
                  <FieldLabel>Send reminder</FieldLabel>
                  <Select
                    value={notif.reminderMinutes || 60}
                    onChange={(e) => updateNotification("reminder", { reminderMinutes: Number(e.target.value) })}
                    style={{ maxWidth: 200 }}
                  >
                    {REMINDER_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </Select>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  /* ================================================================
     TAB 4 — PAGE DESIGNER
     ================================================================ */
  function renderPageDesigner() {
    return (
      <div className="p-5">
        <div className="grid gap-6 lg:grid-cols-[1fr,320px]">
          {/* Live preview */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: "var(--cal-heading)" }}>
              Preview
            </h4>
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--cal-border)", minHeight: 420 }}>
              <div
                className="p-8 flex flex-col items-center justify-center"
                style={{ background: config.pageBackground, minHeight: 420 }}
              >
                {config.pageLogo && (
                  <img src={config.pageLogo} alt="Logo" className="h-12 mb-4 object-contain" />
                )}
                <h2 className="text-xl font-bold mb-6" style={{ color: config.pageAccentColor }}>
                  {config.pageHeading || "Schedule a meeting"}
                </h2>
                {/* Mock calendar slots */}
                <div className="w-full max-w-sm space-y-2">
                  {["9:00 AM", "10:00 AM", "11:00 AM", "2:00 PM", "3:00 PM"].map((slot) => (
                    <div
                      key={slot}
                      className="rounded-lg border px-4 py-3 text-sm font-medium text-center cursor-pointer transition-colors"
                      style={{ borderColor: config.pageAccentColor, color: config.pageAccentColor }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = config.pageAccentColor;
                        e.currentTarget.style.color = "white";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = config.pageAccentColor;
                      }}
                    >
                      {slot}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Settings panel */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider" style={{ color: "var(--cal-heading)" }}>
              Settings
            </h4>
            <div className="rounded-lg border p-4 space-y-4" style={{ borderColor: "var(--cal-border)", background: "white" }}>
              <div>
                <FieldLabel>Page URL slug</FieldLabel>
                <div className="flex items-center gap-1">
                  <span className="text-xs shrink-0" style={{ color: "var(--cal-mid)" }}>app.schedulemuseai.com/</span>
                  <Input
                    value={config.pageSlug}
                    onChange={(e) => update("pageSlug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  />
                </div>
              </div>
              <div>
                <FieldLabel>Background color</FieldLabel>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={config.pageBackground}
                    onChange={(e) => update("pageBackground", e.target.value)}
                    className="h-8 w-8 rounded border cursor-pointer"
                    style={{ borderColor: "var(--cal-border)" }}
                  />
                  <Input value={config.pageBackground} onChange={(e) => update("pageBackground", e.target.value)} style={{ maxWidth: 120 }} />
                </div>
              </div>
              <div>
                <FieldLabel>Logo URL</FieldLabel>
                <Input value={config.pageLogo} onChange={(e) => update("pageLogo", e.target.value)} placeholder="https://..." />
              </div>
              <div>
                <FieldLabel>Heading</FieldLabel>
                <Input value={config.pageHeading} onChange={(e) => update("pageHeading", e.target.value)} />
              </div>
              <div>
                <FieldLabel>Accent color</FieldLabel>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={config.pageAccentColor}
                    onChange={(e) => update("pageAccentColor", e.target.value)}
                    className="h-8 w-8 rounded border cursor-pointer"
                    style={{ borderColor: "var(--cal-border)" }}
                  />
                  <Input value={config.pageAccentColor} onChange={(e) => update("pageAccentColor", e.target.value)} style={{ maxWidth: 120 }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ================================================================
     TAB 5 — EMBED DESIGNER
     ================================================================ */
  function renderEmbedDesigner() {
    const snippet =
      config.embedMode === "inline"
        ? `<div id="schedulemuse-embed"></div>\n<script src="https://app.schedulemuseai.com/embed.js"\n  data-slug="${config.pageSlug}"\n  data-mode="inline"></script>`
        : `<script src="https://app.schedulemuseai.com/embed.js"\n  data-slug="${config.pageSlug}"\n  data-mode="lightbox"\n  data-button-text="${config.embedButtonText}"\n  data-button-color="${config.embedButtonColor}"></script>`;

    return (
      <div className="p-5 space-y-6">
        {/* Mode */}
        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: "var(--cal-heading)" }}>
            Embed mode
          </h4>
          <div className="grid gap-3 sm:grid-cols-2">
            {([
              ["inline",   "Inline embed",    "Calendar loads directly inside a container on your page"],
              ["lightbox", "Lightbox popup",  "A button opens the calendar in a centered overlay"],
            ] as const).map(([mode, title, desc]) => (
              <label
                key={mode}
                className="flex items-start gap-3 cursor-pointer rounded-lg border p-4 transition-colors"
                style={{
                  borderColor: config.embedMode === mode ? "var(--cal-primary)" : "var(--cal-border)",
                  background: config.embedMode === mode ? "var(--cal-hover)" : "white",
                }}
              >
                <input type="radio" name="embedMode" checked={config.embedMode === mode} onChange={() => update("embedMode", mode)} className="mt-0.5 accent-teal-600" />
                <div>
                  <div className="text-sm font-semibold" style={{ color: "var(--cal-heading)" }}>{title}</div>
                  <div className="text-xs" style={{ color: "var(--cal-mid)" }}>{desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Button customization (lightbox only) */}
        {config.embedMode === "lightbox" && (
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: "var(--cal-heading)" }}>
              Button style
            </h4>
            <div className="rounded-lg border p-4 space-y-4" style={{ borderColor: "var(--cal-border)", background: "white" }}>
              <div>
                <FieldLabel>Button text</FieldLabel>
                <Input value={config.embedButtonText} onChange={(e) => update("embedButtonText", e.target.value)} />
              </div>
              <div>
                <FieldLabel>Button color</FieldLabel>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={config.embedButtonColor}
                    onChange={(e) => update("embedButtonColor", e.target.value)}
                    className="h-8 w-8 rounded border cursor-pointer"
                    style={{ borderColor: "var(--cal-border)" }}
                  />
                  <Input value={config.embedButtonColor} onChange={(e) => update("embedButtonColor", e.target.value)} style={{ maxWidth: 120 }} />
                </div>
              </div>
              <div className="pt-2">
                <FieldLabel>Preview</FieldLabel>
                <button
                  type="button"
                  className="rounded-full px-6 py-2.5 text-sm font-semibold text-white shadow-md"
                  style={{ background: config.embedButtonColor }}
                >
                  {config.embedButtonText}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Code snippet */}
        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: "var(--cal-heading)" }}>
            Embed code
          </h4>
          <div className="rounded-lg border p-4" style={{ borderColor: "var(--cal-border)", background: "white" }}>
            <pre
              className="rounded-lg p-4 text-xs overflow-x-auto whitespace-pre-wrap font-mono"
              style={{ background: "var(--cal-bg-alt)", color: "var(--cal-heading)" }}
            >
              {snippet}
            </pre>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(snippet)}
              className="mt-3 rounded-lg px-4 py-2 text-xs font-semibold transition-colors"
              style={{ background: "var(--cal-btn)", color: "var(--cal-heading)" }}
            >
              Copy to clipboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ================================================================
     TAB 6 — PHONE SETTINGS
     ================================================================ */
  function renderPhoneSettings() {
    return (
      <div className="p-5">
        <div className="grid gap-6 lg:grid-cols-[1fr,280px]">
          {/* Settings */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider" style={{ color: "var(--cal-heading)" }}>
              Phone configuration
            </h4>
            <div className="rounded-lg border p-4 space-y-4" style={{ borderColor: "var(--cal-border)", background: "white" }}>
              <div>
                <FieldLabel>Phone number</FieldLabel>
                <Input
                  type="tel"
                  value={config.phoneNumber}
                  onChange={(e) => update("phoneNumber", e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
                <p className="text-xs mt-1.5" style={{ color: "var(--cal-mid)" }}>
                  Guests will see this number on the booking confirmation.
                </p>
              </div>
              <div>
                <FieldLabel>Welcome message</FieldLabel>
                <textarea
                  value={config.phoneWelcomeMessage}
                  onChange={(e) => update("phoneWelcomeMessage", e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                  style={{ borderColor: "var(--cal-border)", color: "var(--cal-heading)" }}
                  placeholder="Thanks for calling! Please book a meeting at your convenience."
                />
              </div>
            </div>
          </div>

          {/* Phone mockup preview */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: "var(--cal-heading)" }}>
              Preview
            </h4>
            <div
              className="rounded-[2rem] border-4 overflow-hidden mx-auto"
              style={{ borderColor: "var(--cal-heading)", width: 240, height: 420 }}
            >
              {/* Status bar */}
              <div
                className="flex items-center justify-between px-4 py-1.5 text-[10px] font-semibold"
                style={{ background: "var(--cal-heading)", color: "white" }}
              >
                <span>9:41</span>
                <span>📶 🔋</span>
              </div>
              {/* Call screen */}
              <div
                className="flex flex-col items-center justify-center p-6 text-center"
                style={{ background: "var(--cal-bg)", height: "calc(100% - 28px)" }}
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-2xl mb-3"
                  style={{ background: "var(--cal-hover)" }}
                >
                  📞
                </div>
                <div className="text-sm font-bold mb-1" style={{ color: "var(--cal-heading)" }}>
                  {config.phoneNumber || "+1 (555) 000-0000"}
                </div>
                <div className="text-xs px-4 leading-relaxed" style={{ color: "var(--cal-text)" }}>
                  {config.phoneWelcomeMessage || "Welcome message will appear here."}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ================================================================
     RENDER
     ================================================================ */
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
          <div className="mt-2">Need help? <a className="underline" href="#">Support</a></div>
          <div className="mt-4"><div className="text-sm text-white/70">Signed in as: you</div></div>
        </div>
      </aside>

      <main className="app-main">
        <header className="app-header">
          <div>
            <h1 className="app-company-name">ScheduleMuseAI</h1>
            <h2 className="app-page-name">Booking Setup</h2>
            <p className="app-subtitle">
              Configure every aspect of your booking page — settings, form, notifications, branding, embedding, and phone.
            </p>
          </div>
          <div className="app-cta">
            <Link href="/dashboard" className="btn-secondary">← Back to dashboard</Link>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? "Saving…" : "Save booking page"}
            </button>
          </div>
        </header>

        {saveMsg && (
          <div
            className="rounded-lg px-4 py-3 text-sm font-medium"
            style={{
              background: saveMsg.startsWith("Error") ? "#ffe4e6" : "var(--cal-hover)",
              color: saveMsg.startsWith("Error") ? "#9f1239" : "var(--cal-heading)",
            }}
          >
            {saveMsg}
          </div>
        )}

        {/* Tab bar + content */}
        <div className="cal-grid">
          <div className="flex overflow-x-auto" style={{ borderBottom: "1px solid var(--cal-border)" }}>
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className="shrink-0 px-5 py-3.5 text-sm font-semibold transition-colors relative"
                style={{
                  color: activeTab === tab.id ? "var(--cal-primary)" : "var(--cal-mid)",
                  background: activeTab === tab.id ? "var(--cal-bg)" : "transparent",
                }}
              >
                <span className="mr-1.5">{tab.icon}</span>
                {tab.label}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: "var(--cal-primary)" }} />
                )}
              </button>
            ))}
          </div>

          {activeTab === "settings" && renderBookingSettings()}
          {activeTab === "form" && renderBookingForm()}
          {activeTab === "notifications" && renderNotifications()}
          {activeTab === "page" && renderPageDesigner()}
          {activeTab === "embed" && renderEmbedDesigner()}
          {activeTab === "phone" && renderPhoneSettings()}
        </div>
      </main>
    </div>
  );
}
