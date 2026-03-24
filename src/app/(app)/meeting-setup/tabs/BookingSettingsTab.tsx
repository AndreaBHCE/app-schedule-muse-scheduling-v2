"use client";

import React from "react";
import {
  FieldLabel,
  InfoIcon,
  Input,
  Section,
  Select,
  Toggle,
} from "@/components/ui/form-primitives";
import {
  CURRENCIES,
  DAY_LABELS,
  DURATION_PRESETS,
  LOCATION_LABELS,
  WEEK_DAYS,
  formatTime24to12,
} from "../constants";
import type { LocationType, SectionTabProps, WeekDay } from "../types";

export default function BookingSettingsTab({
  config,
  update,
  isOpen,
  toggle,
}: SectionTabProps) {
  const enabledDays = WEEK_DAYS.filter((d) => config.availability[d].enabled);
  const availSummary =
    enabledDays.length === 0
      ? "No availability set"
      : `${enabledDays.map((d) => DAY_LABELS[d].slice(0, 3)).join(", ")} · ${formatTime24to12(config.availability[enabledDays[0]].start)} – ${formatTime24to12(config.availability[enabledDays[0]].end)}`;

  const locSummary = `${LOCATION_LABELS[config.location.type]}${config.location.details ? ` · ${config.location.details}` : ""}`;

  return (
    <div>
      {/* ---- Meeting Subject ---- */}
      <Section
        label="Meeting Subject"
        summary={config.meetingSubject}
        expanded={isOpen("subject")}
        onToggle={() => toggle("subject")}
      >
        <FieldLabel>Subject line</FieldLabel>
        <Input
          value={config.meetingSubject}
          onChange={(e) => update("meetingSubject", e.target.value)}
          placeholder="Meeting with John Smith from Acme Builders"
        />
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
            <Select
              value={config.defaultDuration}
              onChange={(e) => update("defaultDuration", Number(e.target.value))}
            >
              {config.durations.map((d) => (
                <option key={d} value={d}>
                  {d} min
                </option>
              ))}
            </Select>
          </div>
        )}
      </Section>

      {/* ---- Host ---- */}
      <Section
        label="Host"
        summary={
          config.hostName
            ? `${config.hostName} <${config.hostEmail}>`
            : "Not configured"
        }
        expanded={isOpen("host")}
        onToggle={() => toggle("host")}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <FieldLabel>Name</FieldLabel>
            <Input
              value={config.hostName}
              onChange={(e) => update("hostName", e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div>
            <FieldLabel>Email</FieldLabel>
            <Input
              type="email"
              value={config.hostEmail}
              onChange={(e) => update("hostEmail", e.target.value)}
              placeholder="you@example.com"
            />
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
          <Input
            value={config.timezone}
            onChange={(e) => update("timezone", e.target.value)}
          />
        </div>
        <div className="flex items-center justify-between">
          <FieldLabel>Weekly hours</FieldLabel>
          <button
            type="button"
            onClick={() => {
              const mon = config.availability.monday;
              const updated = { ...config.availability };
              for (const day of [
                "tuesday",
                "wednesday",
                "thursday",
                "friday",
              ] as WeekDay[]) {
                updated[day] = { ...mon };
              }
              update("availability", updated);
            }}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            style={{
              background: "var(--cal-btn)",
              color: "var(--cal-primary)",
            }}
          >
            Apply Monday&apos;s hours to all weekdays
          </button>
        </div>
        <div className="space-y-2 mt-2">
          {WEEK_DAYS.map((day) => {
            const dh = config.availability[day];
            return (
              <div key={day} className="flex items-center gap-3">
                <Toggle
                  enabled={dh.enabled}
                  onChange={(val) =>
                    update("availability", {
                      ...config.availability,
                      [day]: { ...dh, enabled: val },
                    })
                  }
                />
                <span
                  className="w-20 text-sm font-medium"
                  style={{
                    color: dh.enabled
                      ? "var(--cal-heading)"
                      : "var(--cal-border)",
                  }}
                >
                  {DAY_LABELS[day]}
                </span>
                {dh.enabled && (
                  <>
                    <input
                      type="time"
                      value={dh.start}
                      onChange={(e) =>
                        update("availability", {
                          ...config.availability,
                          [day]: { ...dh, start: e.target.value },
                        })
                      }
                      className="rounded border px-2 py-1 text-sm"
                      style={{
                        borderColor: "var(--cal-border)",
                        color: "var(--cal-heading)",
                      }}
                    />
                    <span style={{ color: "var(--cal-mid)" }}>–</span>
                    <input
                      type="time"
                      value={dh.end}
                      onChange={(e) =>
                        update("availability", {
                          ...config.availability,
                          [day]: { ...dh, end: e.target.value },
                        })
                      }
                      className="rounded border px-2 py-1 text-sm"
                      style={{
                        borderColor: "var(--cal-border)",
                        color: "var(--cal-heading)",
                      }}
                    />
                  </>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      {/* ---- Location ---- */}
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
                background:
                  config.location.type === type ? "var(--cal-primary)" : "white",
                color:
                  config.location.type === type
                    ? "white"
                    : "var(--cal-heading)",
                borderColor:
                  config.location.type === type
                    ? "var(--cal-primary)"
                    : "var(--cal-border)",
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
            onChange={(e) =>
              update("location", { ...config.location, details: e.target.value })
            }
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
          {(
            [
              [
                "one-on-one",
                "One-on-one",
                "Each timeslot is booked by one guest",
              ],
              [
                "group",
                "Group",
                "Multiple guests share the same timeslot",
              ],
              [
                "concurrent",
                "Concurrent",
                "Multiple separate meetings can run at the same time",
              ],
            ] as const
          ).map(([value, title, desc]) => (
            <label
              key={value}
              className="flex items-start gap-3 cursor-pointer rounded-lg border p-3 transition-colors"
              style={{
                borderColor:
                  config.sessionType === value
                    ? "var(--cal-primary)"
                    : "var(--cal-border)",
                background:
                  config.sessionType === value ? "var(--cal-hover)" : "white",
              }}
            >
              <input
                type="radio"
                name="sessionType"
                checked={config.sessionType === value}
                onChange={() => update("sessionType", value)}
                className="mt-0.5 accent-teal-600"
              />
              <div>
                <div
                  className="text-sm font-semibold"
                  style={{ color: "var(--cal-heading)" }}
                >
                  {title}
                </div>
                <div className="text-xs" style={{ color: "var(--cal-mid)" }}>
                  {desc}
                </div>
              </div>
            </label>
          ))}
        </div>
        {config.sessionType === "group" && (
          <div className="mt-3">
            <FieldLabel>Max group size</FieldLabel>
            <Input
              type="number"
              min={2}
              max={100}
              value={config.groupMaxSize}
              onChange={(e) => update("groupMaxSize", Number(e.target.value))}
            />
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
            <Input
              type="number"
              min={0}
              value={config.minNoticeHours}
              onChange={(e) =>
                update("minNoticeHours", Number(e.target.value))
              }
            />
          </div>
          <div>
            <FieldLabel>How far ahead (days)</FieldLabel>
            <Input
              type="number"
              min={1}
              value={config.maxAdvanceDays}
              onChange={(e) =>
                update("maxAdvanceDays", Number(e.target.value))
              }
            />
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
            <FieldLabel>Slot interval</FieldLabel>
            <Select
              value={config.slotIntervalMinutes}
              onChange={(e) =>
                update("slotIntervalMinutes", Number(e.target.value))
              }
            >
              {[5, 10, 15, 20, 30, 60].map((v) => (
                <option key={v} value={v}>
                  {v} min
                </option>
              ))}
              <option value={90}>90 min</option>
              <option value={120}>2 hr</option>
              <option value={180}>3 hr</option>
              <option value={240}>4 hr</option>
              <option value={300}>5 hr</option>
              <option value={360}>6 hr</option>
            </Select>
          </div>
          <div>
            <FieldLabel>Buffer before (min)</FieldLabel>
            <Input
              type="number"
              min={0}
              value={config.bufferBeforeMinutes}
              onChange={(e) =>
                update("bufferBeforeMinutes", Number(e.target.value))
              }
            />
          </div>
          <div>
            <FieldLabel>Buffer after (min)</FieldLabel>
            <Input
              type="number"
              min={0}
              value={config.bufferAfterMinutes}
              onChange={(e) =>
                update("bufferAfterMinutes", Number(e.target.value))
              }
            />
          </div>
        </div>
      </Section>

      {/* ---- Payment ---- */}
      <Section
        label="Payment"
        summary={
          config.paymentEnabled
            ? `${config.paymentCurrency} ${config.paymentAmount.toFixed(2)}`
            : "Disabled"
        }
        expanded={isOpen("payment")}
        onToggle={() => toggle("payment")}
      >
        <Toggle
          enabled={config.paymentEnabled}
          onChange={(val) => update("paymentEnabled", val)}
          label="Require payment to book"
        />
        {config.paymentEnabled && (
          <div className="grid gap-3 sm:grid-cols-2 mt-3">
            <div>
              <FieldLabel>Amount</FieldLabel>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={config.paymentAmount}
                onChange={(e) =>
                  update("paymentAmount", Number(e.target.value))
                }
              />
            </div>
            <div>
              <FieldLabel>Currency</FieldLabel>
              <Select
                value={config.paymentCurrency}
                onChange={(e) => update("paymentCurrency", e.target.value)}
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        )}
      </Section>
    </div>
  );
}
