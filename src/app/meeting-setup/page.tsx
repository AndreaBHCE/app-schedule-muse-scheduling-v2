"use client";

import Link from "next/link";
import React, { useCallback, useState } from "react";
import AppSidebar from "@/components/layout/AppSidebar";

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
  pagePublished: boolean;
  pageBackgroundType: "solid" | "gradient" | "image" | "video";
  pageBackground: string;
  pageBackgroundImage: string;
  pageLogo: string;
  pageProfileImage: string;
  pageHeading: string;
  pageSubheading: string;
  pageWelcomeMessage: string;
  pageHostName: string;
  pageHostTitle: string;
  pageCompanyName: string;
  pageInfoTextColor: string;
  pageInfoBgOpacity: number;
  pageButtonColor: string;
  pageSchedulingBgOpacity: number;
  pageAccentColor: string;
  pageFooter: string;
  /* Tab 5 — Embed Designer */
  embedMode: "inline" | "lightbox" | "email-signature";
  embedButtonText: string;
  embedButtonColor: string;
  embedSignatureText: string;
  embedSignatureStyle: "link" | "button";
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
  scheduled:   { title: "Meeting Scheduled",  desc: "Sent when you or a guest books or modifies a meeting" },
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
    meetingSubject: "",
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
    maxAdvanceDays: 3,
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
    pagePublished: true,
    pageBackgroundType: "solid",
    pageBackground: "#111934",
    pageBackgroundImage: "",
    pageLogo: "",
    pageProfileImage: "",
    pageHeading: "Schedule a Meeting with ScheduleMuseAI",
    pageSubheading: "Let's connect to discuss your scheduling needs.",
    pageWelcomeMessage: "Thank you for connecting. Please select a convenient time for our call from the options on the right. I look forward to speaking with you.",
    pageHostName: "",
    pageHostTitle: "",
    pageCompanyName: "ScheduleMuseAI",
    pageInfoTextColor: "#333333",
    pageInfoBgOpacity: 90,
    pageButtonColor: "#111934",
    pageSchedulingBgOpacity: 100,
    pageAccentColor: "#00bfa5",
    pageFooter: "If the times shown do not fit your schedule, send an email to support@schedulemuseai.com",
    embedMode: "inline",
    embedButtonText: "Book a meeting",
    embedButtonColor: "#00bfa5",
    embedSignatureText: "Schedule a meeting with me",
    embedSignatureStyle: "link",
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

function InfoIcon({ tip }: { tip: string }) {
  return (
    <span className="hint-icon" data-tip={tip} aria-label="Info">
      ?
    </span>
  );
}

function Section({
  label,
  summary,
  tooltip,
  expanded,
  onToggle,
  children,
}: {
  label: string;
  summary: string;
  tooltip?: string;
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
        <div className="flex items-center gap-2">
          <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--cal-mid)" }}>
            {label}
          </div>
          {tooltip && <InfoIcon tip={tooltip} />}
        </div>
        <div className="flex-1 min-w-0">
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
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["subject"]));
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
        <Section
          label="Availability"
          summary={availSummary}
          tooltip="Set the weekly hours when you are actually bookable. Use this to prevent outside-office meetings."
          expanded={isOpen("availability")}
          onToggle={() => toggle("availability")}
        >
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
        <Section
          label="Location"
          summary={locSummary}
          tooltip="Pick one meeting location type for this booking calendar. Then provide the link/number/address."
          expanded={isOpen("location")}
          onToggle={() => toggle("location")}
        >
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
          tooltip="Minimum notice prevents last-minute bookings; how far ahead controls the maximum advance scheduling horizon."
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
          tooltip="Slot interval sets step size for available times; buffer before/after keeps breathing room between meetings."
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
          Configure which notifications are sent to guests for each booking calendar.
        </p>
        <p className="text-sm font-semibold" style={{ color: "var(--cal-heading)" }}>
          Meeting Scheduled
        </p>
        <p className="text-xs" style={{ color: "var(--cal-mid)" }}>
          Sent when you or a guest books or modifies a meeting
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
    /* ---- helpers for the preview ---- */
    const infoBgRgba = `rgba(255,255,255,${config.pageInfoBgOpacity / 100})`;
    const schedBgRgba = `rgba(255,255,255,${config.pageSchedulingBgOpacity / 100})`;

    const MOCK_DAYS = [
      [null, null, null, null, 1, 2, 3],
      [4, 5, 6, 7, 8, 9, 10],
      [11, 12, 13, 14, 15, 16, 17],
      [18, 19, 20, 21, 22, 23, 24],
      [25, 26, 27, 28, 29, 30, null],
    ];
    const highlightDay = 6;

    return (
      <div className="pd-root">
        {/* ============================================================
            LEFT — BROWSER PREVIEW
            ============================================================ */}
        <div className="pd-preview-col">
          {/* Desktop / Mobile toggle (decorative) */}
          <div className="flex items-center gap-2 mb-3 justify-center">
            <button className="pd-device-btn pd-device-btn--active" title="Desktop">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm11 1H6v4h8V6zM5 16a1 1 0 100-2h10a1 1 0 100 2H5z" clipRule="evenodd" /></svg>
            </button>
            <button className="pd-device-btn" title="Mobile">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7 2a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2H7zm3 14a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>
            </button>
          </div>

          {/* Browser chrome */}
          <div className="pd-browser">
            <div className="pd-browser__bar">
              <span className="pd-dot pd-dot--red" />
              <span className="pd-dot pd-dot--yellow" />
              <span className="pd-dot pd-dot--green" />
            </div>

            {/* Page body */}
            <div
              className="pd-browser__body"
              style={{
                background:
                  config.pageBackgroundType === "image" && config.pageBackgroundImage
                    ? `url(${config.pageBackgroundImage}) center/cover no-repeat`
                    : config.pageBackgroundType === "gradient"
                    ? `linear-gradient(135deg, ${config.pageBackground}, ${config.pageAccentColor})`
                    : config.pageBackground,
                position: "relative",
              }}
            >
              {/* Video background */}
              {config.pageBackgroundType === "video" && config.pageBackgroundImage && (
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="pd-video-bg"
                  src={config.pageBackgroundImage}
                />
              )}
              <div className="pd-page-layout" style={{ position: "relative", zIndex: 1 }}>
                {/* ---- Information pane ---- */}
                <div className="pd-info-pane" style={{ background: infoBgRgba, color: config.pageInfoTextColor }}>
                  {config.pageLogo && (
                    <img src={config.pageLogo} alt="Logo" className="pd-info-logo" />
                  )}
                  {config.pageProfileImage && (
                    <img src={config.pageProfileImage} alt="Profile" className="pd-info-profile" />
                  )}
                  <h3 className="pd-info-heading">{config.pageHeading || "Schedule a Meeting"}</h3>
                  {config.pageSubheading && (
                    <p className="pd-info-sub">{config.pageSubheading}</p>
                  )}
                  {config.pageWelcomeMessage && (
                    <p className="pd-info-welcome">{config.pageWelcomeMessage}</p>
                  )}
                  {(config.pageHostName || config.pageHostTitle || config.pageCompanyName) && (
                    <div className="pd-info-host">
                      {config.pageHostName && <div className="pd-info-host-name">{config.pageHostName}</div>}
                      {config.pageHostTitle && <div className="pd-info-host-title">{config.pageHostTitle}</div>}
                      {config.pageCompanyName && <div className="pd-info-host-company">{config.pageCompanyName}</div>}
                    </div>
                  )}
                </div>

                {/* ---- Interaction pane ---- */}
                <div className="pd-interaction-pane" style={{ background: schedBgRgba }}>
                  {/* Mini calendar */}
                  <div className="pd-mini-cal">
                    <div className="pd-mini-cal__header">
                      <div className="text-[10px] font-semibold tracking-wide" style={{ color: "#666" }}>
                        {"S  M  T  W  T  F  S".split("  ").map((d, i) => (
                          <span key={i} className="pd-mini-cal__dow">{d}</span>
                        ))}
                      </div>
                    </div>
                    {MOCK_DAYS.map((week, wi) => (
                      <div key={wi} className="pd-mini-cal__week">
                        {week.map((day, di) => (
                          <span
                            key={di}
                            className={`pd-mini-cal__day ${day === highlightDay ? "pd-mini-cal__day--active" : ""} ${day && day >= 12 && day <= 17 ? "pd-mini-cal__day--highlight" : ""}`}
                            style={day === highlightDay ? { background: config.pageButtonColor, color: "#fff" } : day && day >= 12 && day <= 17 ? { color: config.pageButtonColor, fontWeight: 700 } : undefined}
                          >
                            {day ?? ""}
                          </span>
                        ))}
                      </div>
                    ))}
                  </div>

                  {/* Time slots */}
                  <div className="pd-time-slots">
                    {["9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM"].map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        className="pd-time-slot"
                        style={{ borderColor: config.pageButtonColor, color: config.pageButtonColor }}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer inside preview */}
              {config.pageFooter && (
                <div className="pd-page-footer" style={{ color: config.pageInfoTextColor, position: "relative", zIndex: 1 }}>
                  {config.pageFooter}
                </div>
              )}
            </div>
          </div>

          <p className="text-center text-xs mt-3" style={{ color: "var(--cal-mid)" }}>
            This is a limited preview of your page.
          </p>
        </div>

        {/* ============================================================
            RIGHT — SETTINGS PANEL
            ============================================================ */}
        <div className="pd-settings-col">
          {/* ---- Page URL ---- */}
          <div className="pd-settings-section">
            <div className="flex items-center justify-between mb-2">
              <span className="pd-settings-label">Page URL</span>
              <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: config.pagePublished ? "#16a34a" : "var(--cal-mid)" }}>
                <span className="inline-block w-2 h-2 rounded-full" style={{ background: config.pagePublished ? "#16a34a" : "var(--cal-mid)" }} />
                {config.pagePublished ? "Published" : "Draft"}
              </span>
            </div>
            <div className="flex items-center gap-1 mb-1">
              <span className="text-xs shrink-0" style={{ color: "var(--cal-mid)" }}>https://app.schedulemuseai.com/</span>
              <Input
                value={config.pageSlug}
                onChange={(e) => update("pageSlug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              />
            </div>
            <button type="button" className="text-xs font-medium" style={{ color: "var(--cal-primary)" }}>Customize URL</button>
          </div>

          {/* ---- Page Background ---- */}
          <div className="pd-settings-section">
            <span className="pd-settings-label">Page Background</span>
            <div className="grid grid-cols-4 gap-2 mt-2 mb-3">
              {([
                ["solid", "Solid color", "⬛"],
                ["gradient", "Dynamic gradient", "🌐"],
                ["image", "Image", "🖼️"],
                ["video", "Video", "▶️"],
              ] as const).map(([type, label, icon]) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => update("pageBackgroundType", type as "solid" | "gradient" | "image" | "video")}
                  className={`pd-bg-option ${config.pageBackgroundType === type ? "pd-bg-option--active" : ""}`}
                >
                  <span className="text-lg">{icon}</span>
                  <span className="text-[10px] leading-tight">{label}</span>
                  {type === "video" && <span className="pd-new-badge">New</span>}
                </button>
              ))}
            </div>
            {/* Tooltips for image & video limits */}
            <div className="flex items-center gap-3 mb-3">
              <InfoIcon tip="Supported formats: JPG, PNG, WebP. Max file size: 5 MB. Recommended resolution: 1920×1080px or higher." />
              <span className="text-xs" style={{ color: "var(--cal-mid)" }}>Image limits</span>
              <InfoIcon tip="Supported formats: MP4, WebM. Max file size: 30 MB. Max duration: 60 seconds. Resolution: 1920×1080px recommended. Video will auto-loop and play muted." />
              <span className="text-xs" style={{ color: "var(--cal-mid)" }}>Video limits</span>
            </div>
            {config.pageBackgroundType === "solid" && (
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
            )}
            {config.pageBackgroundType === "gradient" && (
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
            )}
            {config.pageBackgroundType === "image" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <FieldLabel>Background Image</FieldLabel>
                  <label className="pd-choose-btn cursor-pointer">
                    Upload image
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={() => {}} />
                  </label>
                </div>
                <Input value={config.pageBackgroundImage} onChange={(e) => update("pageBackgroundImage", e.target.value)} placeholder="Or paste image URL (JPG, PNG, WebP)" />
                {config.pageBackgroundImage && (
                  <div className="rounded-lg border overflow-hidden" style={{ borderColor: "var(--cal-border)", maxHeight: 120 }}>
                    <img src={config.pageBackgroundImage} alt="Background preview" className="w-full h-full object-cover" style={{ maxHeight: 120 }} />
                  </div>
                )}
              </div>
            )}
            {config.pageBackgroundType === "video" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <FieldLabel>Background Video</FieldLabel>
                  <label className="pd-choose-btn cursor-pointer">
                    Upload video
                    <input type="file" accept="video/mp4,video/webm" className="hidden" onChange={() => {}} />
                  </label>
                </div>
                <Input value={config.pageBackgroundImage} onChange={(e) => update("pageBackgroundImage", e.target.value)} placeholder="Or paste video URL (MP4, WebM)" />
                {config.pageBackgroundImage && (
                  <div className="rounded-lg border overflow-hidden" style={{ borderColor: "var(--cal-border)", maxHeight: 120 }}>
                    <video src={config.pageBackgroundImage} className="w-full" style={{ maxHeight: 120 }} muted autoPlay loop playsInline />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ---- Information Pane ---- */}
          <div className="pd-settings-section">
            <span className="pd-settings-label">Information Pane</span>

            {/* Logo */}
            <div className="mt-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold" style={{ color: "var(--cal-heading)" }}>Logo</span>
                  <span className="text-xs cursor-pointer" style={{ color: "var(--cal-primary)" }}>(Reset)</span>
                  <InfoIcon tip="Upload your company or brand logo. Recommended size: 200×60px." />
                </div>
                <label className="pd-choose-btn cursor-pointer">
                  Choose image
                  <input type="file" accept="image/*" className="hidden" onChange={() => {}} />
                </label>
              </div>
              {config.pageLogo && (
                <div className="mt-2 w-16 h-16 rounded border flex items-center justify-center overflow-hidden" style={{ borderColor: "var(--cal-border)", background: "#f9fafb" }}>
                  <img src={config.pageLogo} alt="Logo preview" className="max-w-full max-h-full object-contain" />
                </div>
              )}
              <Input className="mt-2" value={config.pageLogo} onChange={(e) => update("pageLogo", e.target.value)} placeholder="Logo image URL" />
            </div>

            {/* Profile Image */}
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold" style={{ color: "var(--cal-heading)" }}>Profile Image</span>
                  <span className="text-xs cursor-pointer" style={{ color: "var(--cal-primary)" }}>(Reset)</span>
                  <InfoIcon tip="Upload a profile photo. Recommended size: 150×150px." />
                </div>
                <label className="pd-choose-btn cursor-pointer">
                  Choose image
                  <input type="file" accept="image/*" className="hidden" onChange={() => {}} />
                </label>
              </div>
              {config.pageProfileImage && (
                <div className="mt-2 w-16 h-16 rounded-full border overflow-hidden" style={{ borderColor: "var(--cal-border)" }}>
                  <img src={config.pageProfileImage} alt="Profile preview" className="w-full h-full object-cover" />
                </div>
              )}
              <Input className="mt-2" value={config.pageProfileImage} onChange={(e) => update("pageProfileImage", e.target.value)} placeholder="Profile image URL" />
            </div>

            {/* Heading */}
            <div className="mt-4">
              <FieldLabel>Heading</FieldLabel>
              <Input value={config.pageHeading} onChange={(e) => update("pageHeading", e.target.value)} />
            </div>

            {/* Subheading */}
            <div className="mt-4">
              <FieldLabel>Subheading</FieldLabel>
              <Input value={config.pageSubheading} onChange={(e) => update("pageSubheading", e.target.value)} />
            </div>

            {/* Welcome Message */}
            <div className="mt-4">
              <FieldLabel>Welcome Message</FieldLabel>
              <textarea
                value={config.pageWelcomeMessage}
                onChange={(e) => update("pageWelcomeMessage", e.target.value)}
                rows={4}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                style={{ borderColor: "var(--cal-border)", color: "var(--cal-heading)" }}
              />
              <div className="flex items-center gap-2 mt-1.5">
                <button type="button" className="pd-fmt-btn" title="Bold"><strong>B</strong></button>
                <button type="button" className="pd-fmt-btn" title="Italic"><em>I</em></button>
                <button type="button" className="pd-fmt-btn" title="Link">🔗</button>
              </div>
            </div>

            {/* Host details */}
            <div className="mt-4">
              <FieldLabel>Host Name</FieldLabel>
              <Input value={config.pageHostName} onChange={(e) => update("pageHostName", e.target.value)} placeholder="e.g. Andrea Petralia" />
            </div>
            <div className="mt-3">
              <FieldLabel>Host Title</FieldLabel>
              <Input value={config.pageHostTitle} onChange={(e) => update("pageHostTitle", e.target.value)} placeholder="e.g. Director of Operations" />
            </div>
            <div className="mt-3">
              <FieldLabel>Company Name</FieldLabel>
              <Input value={config.pageCompanyName} onChange={(e) => update("pageCompanyName", e.target.value)} placeholder="e.g. ScheduleMuseAI" />
            </div>

            {/* Social Links */}
            <div className="mt-4">
              <button type="button" className="flex items-center gap-1 text-sm font-medium" style={{ color: "var(--cal-primary)" }}>
                <span className="text-lg">⊕</span> Add social links
              </button>
            </div>

            {/* Information Text Color */}
            <div className="mt-4">
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-sm font-semibold" style={{ color: "var(--cal-heading)" }}>Information Text Color</span>
                <span className="text-xs cursor-pointer" style={{ color: "var(--cal-primary)" }}>(Reset)</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={config.pageInfoTextColor}
                  onChange={(e) => update("pageInfoTextColor", e.target.value)}
                  className="h-8 w-8 rounded border cursor-pointer"
                  style={{ borderColor: "var(--cal-border)" }}
                />
                <Input value={config.pageInfoTextColor} onChange={(e) => update("pageInfoTextColor", e.target.value)} style={{ maxWidth: 120 }} />
              </div>
            </div>

            {/* Information Background Opacity */}
            <div className="mt-4">
              <FieldLabel>Information Background Opacity</FieldLabel>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={25}
                  max={100}
                  value={config.pageInfoBgOpacity}
                  onChange={(e) => update("pageInfoBgOpacity", Number(e.target.value))}
                  className="flex-1 accent-teal-600"
                />
                <span className="text-sm font-semibold w-10 text-right" style={{ color: "var(--cal-heading)" }}>{config.pageInfoBgOpacity}%</span>
              </div>
            </div>
          </div>

          {/* ---- Interaction Pane ---- */}
          <div className="pd-settings-section">
            <span className="pd-settings-label">Interaction Pane</span>

            {/* Button Color */}
            <div className="mt-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-sm font-semibold" style={{ color: "var(--cal-heading)" }}>Button Color</span>
                <span className="text-xs cursor-pointer" style={{ color: "var(--cal-primary)" }}>(Reset)</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={config.pageButtonColor}
                  onChange={(e) => update("pageButtonColor", e.target.value)}
                  className="h-8 w-8 rounded border cursor-pointer"
                  style={{ borderColor: "var(--cal-border)" }}
                />
                <Input value={config.pageButtonColor} onChange={(e) => update("pageButtonColor", e.target.value)} style={{ maxWidth: 120 }} />
              </div>
            </div>

            {/* Scheduling Background Opacity */}
            <div className="mt-4">
              <FieldLabel>Scheduling Background Opacity</FieldLabel>
              <div className="grid grid-cols-4 gap-x-4 gap-y-1 mt-1">
                {[50, 65, 85, 100, 55, 70, 90, null, 60, 80, 95, null].map((val, i) => (
                  val !== null ? (
                    <label key={val} className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="schedBgOpacity"
                        checked={config.pageSchedulingBgOpacity === val}
                        onChange={() => update("pageSchedulingBgOpacity", val)}
                        className="accent-teal-600"
                      />
                      <span className="text-sm" style={{ color: "var(--cal-heading)" }}>{val}%</span>
                    </label>
                  ) : <span key={`empty-${i}`} />
                ))}
              </div>
            </div>
          </div>

          {/* ---- Page Footer ---- */}
          <div className="pd-settings-section">
            <span className="pd-settings-label">Page Footer</span>
            <textarea
              value={config.pageFooter}
              onChange={(e) => update("pageFooter", e.target.value)}
              rows={3}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none mt-2"
              style={{ borderColor: "var(--cal-border)", color: "var(--cal-heading)" }}
            />
            <div className="flex items-center gap-2 mt-1.5">
              <button type="button" className="pd-fmt-btn" title="Bold"><strong>B</strong></button>
              <button type="button" className="pd-fmt-btn" title="Link">🔗</button>
            </div>
          </div>

          {/* ---- Bottom actions ---- */}
          <div className="pd-settings-actions">
            <button type="button" onClick={handleSave} className="pd-save-btn">Save</button>
            <button type="button" className="pd-discard-btn">Discard</button>
            <button type="button" className="pd-share-btn">Share your page</button>
          </div>
        </div>
      </div>
    );
  }

  /* ================================================================
     TAB 5 — EMBED DESIGNER
     ================================================================ */
  function renderEmbedDesigner() {
    const bookingUrl = `https://app.schedulemuseai.com/${config.pageSlug}`;

    const snippet =
      config.embedMode === "inline"
        ? `<div id="schedulemuse-embed"></div>\n<script src="https://app.schedulemuseai.com/embed.js"\n  data-slug="${config.pageSlug}"\n  data-mode="inline"></script>`
        : config.embedMode === "lightbox"
        ? `<script src="https://app.schedulemuseai.com/embed.js"\n  data-slug="${config.pageSlug}"\n  data-mode="lightbox"\n  data-button-text="${config.embedButtonText}"\n  data-button-color="${config.embedButtonColor}"></script>`
        : config.embedSignatureStyle === "button"
        ? `<table cellpadding="0" cellspacing="0" border="0" style="margin-top:12px">\n  <tr>\n    <td>\n      <a href="${bookingUrl}"\n         target="_blank"\n         style="display:inline-block;padding:10px 22px;background:${config.embedButtonColor};color:#ffffff;font-family:Arial,sans-serif;font-size:14px;font-weight:600;text-decoration:none;border-radius:6px;"\n      >${config.embedSignatureText}</a>\n    </td>\n  </tr>\n</table>`
        : `<a href="${bookingUrl}"\n   target="_blank"\n   style="color:${config.embedButtonColor};font-family:Arial,sans-serif;font-size:13px;text-decoration:underline;"\n>${config.embedSignatureText}</a>`;

    return (
      <div className="p-5 space-y-6">
        {/* Mode */}
        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: "var(--cal-heading)" }}>
            Embed mode
          </h4>
          <div className="grid gap-3 sm:grid-cols-3">
            {([
              ["inline",          "Inline embed",      "Calendar loads directly inside a container on your page"],
              ["lightbox",        "Lightbox popup",    "A button opens the calendar in a centered overlay"],
              ["email-signature", "Email signature",   "Add a booking link or button to your email signature"],
            ] as const).map(([mode, title, desc]) => (
              <label
                key={mode}
                className="flex items-start gap-3 cursor-pointer rounded-lg border p-4 transition-colors"
                style={{
                  borderColor: config.embedMode === mode ? "var(--cal-primary)" : "var(--cal-border)",
                  background: config.embedMode === mode ? "var(--cal-hover)" : "white",
                }}
              >
                <input type="radio" name="embedMode" checked={config.embedMode === mode} onChange={() => update("embedMode", mode as "inline" | "lightbox" | "email-signature")} className="mt-0.5 accent-teal-600" />
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

        {/* Email signature customization */}
        {config.embedMode === "email-signature" && (
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: "var(--cal-heading)" }}>
              Signature style
            </h4>
            <div className="rounded-lg border p-4 space-y-4" style={{ borderColor: "var(--cal-border)", background: "white" }}>
              {/* Style: link vs button */}
              <div>
                <FieldLabel>Display as</FieldLabel>
                <div className="flex items-center gap-4 mt-1">
                  {(["link", "button"] as const).map((s) => (
                    <label key={s} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="sigStyle" checked={config.embedSignatureStyle === s} onChange={() => update("embedSignatureStyle", s)} className="accent-teal-600" />
                      <span className="text-sm capitalize" style={{ color: "var(--cal-heading)" }}>{s}</span>
                    </label>
                  ))}
                </div>
              </div>
              {/* Link / button text */}
              <div>
                <FieldLabel>Link text</FieldLabel>
                <Input value={config.embedSignatureText} onChange={(e) => update("embedSignatureText", e.target.value)} placeholder="Schedule a meeting with me" />
              </div>
              {/* Color */}
              <div>
                <FieldLabel>{config.embedSignatureStyle === "button" ? "Button color" : "Link color"}</FieldLabel>
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
              {/* Live preview */}
              <div className="pt-3" style={{ borderTop: "1px solid var(--cal-border)" }}>
                <FieldLabel>Preview (how it will look in your email)</FieldLabel>
                <div className="rounded-lg p-5 mt-1" style={{ background: "#f9fafb", border: "1px solid var(--cal-border)" }}>
                  <p className="text-sm" style={{ color: "#333", fontFamily: "Arial, sans-serif" }}>Best regards,</p>
                  <p className="text-sm font-semibold mt-1" style={{ color: "#333", fontFamily: "Arial, sans-serif" }}>{config.hostName || "Your Name"}</p>
                  <p className="text-xs" style={{ color: "#666", fontFamily: "Arial, sans-serif" }}>{config.pageCompanyName || "Your Company"}</p>
                  <div className="mt-3">
                    {config.embedSignatureStyle === "button" ? (
                      <span
                        className="inline-block rounded-md px-5 py-2 text-sm font-semibold text-white"
                        style={{ background: config.embedButtonColor, fontFamily: "Arial, sans-serif" }}
                      >
                        {config.embedSignatureText || "Schedule a meeting with me"}
                      </span>
                    ) : (
                      <a
                        href="#"
                        onClick={(e) => e.preventDefault()}
                        className="text-sm underline"
                        style={{ color: config.embedButtonColor, fontFamily: "Arial, sans-serif" }}
                      >
                        {config.embedSignatureText || "Schedule a meeting with me"}
                      </a>
                    )}
                  </div>
                </div>
                <p className="text-xs mt-2" style={{ color: "var(--cal-mid)" }}>
                  Paste the HTML below into your email client&apos;s signature editor (Gmail, Outlook, Apple Mail, etc.)
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Code snippet */}
        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: "var(--cal-heading)" }}>
            {config.embedMode === "email-signature" ? "Signature HTML" : "Embed code"}
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
            <div className="relative mx-auto" style={{ width: 240 }}>
              {/* Your iPhone image IS the phone */}
              <img
                src="/iphone-icon-sunset-transparent-overlay.png"
                alt="Phone preview"
                style={{ width: "100%", height: "auto", display: "block" }}
              />
              {/* Text overlay */}
              <div
                className="absolute inset-0 flex flex-col items-center justify-center text-center p-8"
                style={{ paddingTop: "45%" }}
              >
                <div className="text-sm font-bold mb-1 text-white">
                  {config.phoneNumber || "+1 (555) 000-0000"}
                </div>
                <div className="text-xs px-4 leading-relaxed text-white/90">
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
      <AppSidebar />

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
