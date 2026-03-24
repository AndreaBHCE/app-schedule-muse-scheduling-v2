"use client";

import React from "react";
import { FieldLabel, Select, Toggle } from "@/components/ui/form-primitives";
import { NOTIFICATION_LABELS, REMINDER_OPTIONS } from "../constants";
import type { NotificationConfig, NotificationEvent, TabProps } from "../types";

export default function NotificationsTab({ config, update }: TabProps) {
  function updateNotification(
    event: NotificationEvent,
    patch: Partial<NotificationConfig>,
  ) {
    update(
      "notifications",
      config.notifications.map((n) =>
        n.event === event ? { ...n, ...patch } : n,
      ),
    );
  }

  return (
    <div className="p-5 space-y-3">
      <p className="text-sm mb-4" style={{ color: "var(--cal-text)" }}>
        Configure which notifications are sent to guests for each booking
        calendar.
      </p>
      <p
        className="text-sm font-semibold"
        style={{ color: "var(--cal-heading)" }}
      >
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
                <div
                  className="text-sm font-bold"
                  style={{ color: "var(--cal-heading)" }}
                >
                  {meta.title}
                </div>
                <div
                  className="text-xs mt-0.5"
                  style={{ color: "var(--cal-mid)" }}
                >
                  {meta.desc}
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <Toggle
                  enabled={notif.emailEnabled}
                  onChange={(val) =>
                    updateNotification(notif.event, { emailEnabled: val })
                  }
                  label="Email"
                />
                <Toggle
                  enabled={notif.smsEnabled}
                  onChange={(val) =>
                    updateNotification(notif.event, { smsEnabled: val })
                  }
                  label="SMS"
                />
              </div>
            </div>
            {notif.event === "reminder" && (
              <div
                className="mt-3 pt-3"
                style={{ borderTop: "1px solid var(--cal-border)" }}
              >
                <FieldLabel>Send reminder</FieldLabel>
                <Select
                  value={notif.reminderMinutes || 60}
                  onChange={(e) =>
                    updateNotification("reminder", {
                      reminderMinutes: Number(e.target.value),
                    })
                  }
                  style={{ maxWidth: 200 }}
                >
                  {REMINDER_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
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
