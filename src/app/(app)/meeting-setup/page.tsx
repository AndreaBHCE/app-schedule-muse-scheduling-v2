"use client";

import Link from "next/link";
import React, { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { TABS, defaultConfig } from "./constants";
import type { BookingConfig, TabId } from "./types";
import {
  BookingSettingsTab,
  BookingFormTab,
  NotificationsTab,
  PageDesignerTab,
  EmbedDesignerTab,
  PhoneSettingsTab,
} from "./tabs";

/* ================================================================
   SAMPLE CONTACT (used in Page Designer merge-tag preview)
   ================================================================ */

const SAMPLE_CONTACT = {
  firstName: "Jane",
  lastName: "Doe",
  email: "jane.doe@example.com",
  name: "Jane Doe",
} as const;

/* ================================================================
   WRAPPER — Suspense boundary for useSearchParams()
   ================================================================ */

export default function MeetingSetupPageWrapper() {
  return (
    <Suspense
      fallback={
        <div
          className="p-8 text-center"
          style={{ color: "var(--cal-mid)" }}
        >
          Loading…
        </div>
      }
    >
      <MeetingSetupPageContent />
    </Suspense>
  );
}

/* ================================================================
   MAIN COMPONENT — state, handlers, layout shell
   ================================================================ */

function MeetingSetupPageContent() {
  const searchParams = useSearchParams();
  const [config, setConfig] = useState<BookingConfig>(defaultConfig);
  const [activeTab, setActiveTab] = useState<TabId>("settings");
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["subject"]));
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /* ── Load existing booking when ?edit=<id> is present ── */
  useEffect(() => {
    const id = searchParams.get("edit");
    if (!id) return;
    setEditingId(id);
    setLoading(true);
    fetch(`/api/bookings/${encodeURIComponent(id)}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((data) => {
        if (data.booking?.config) {
          setConfig({ ...defaultConfig(), ...data.booking.config });
        }
      })
      .catch((err: unknown) => {
        console.warn("Failed to load booking for editing:", err);
        setSaveMsg("Could not load booking — starting with defaults.");
      })
      .finally(() => setLoading(false));
  }, [searchParams]);

  /* ── Auto-clear messages after 5 seconds ── */
  useEffect(() => {
    if (!saveMsg) return;
    const t = setTimeout(() => setSaveMsg(null), 5000);
    return () => clearTimeout(t);
  }, [saveMsg]);

  /* ── Config updater (stable reference via useCallback) ── */
  const update = useCallback(
    <K extends keyof BookingConfig>(key: K, value: BookingConfig[K]) => {
      setConfig((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  /* ── File upload handler (reads file → data-URL → config) ── */
  function handleFileUpload(
    e: React.ChangeEvent<HTMLInputElement>,
    configKey: keyof BookingConfig,
    maxMB: number,
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > maxMB * 1024 * 1024) {
      setSaveMsg(`File too large — max ${maxMB} MB.`);
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        update(configKey as keyof BookingConfig, reader.result as never);
      }
    };
    reader.onerror = () => setSaveMsg("Failed to read file.");
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  /* ── Section expand/collapse helpers ── */
  function toggle(section: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  }

  const isOpen = (s: string) => expanded.has(s);

  /* ── Save / Update booking ── */
  async function handleSave() {
    setSaving(true);
    setSaveMsg(null);
    try {
      const payload = {
        title: config.meetingSubject || "Untitled Booking",
        durationMinutes: config.defaultDuration,
        bufferMinutes: config.bufferAfterMinutes,
        locationType:
          config.location.type === "video"
            ? "virtual"
            : config.location.type,
        locationDetails: config.location.details,
        config,
      };

      let res: Response;
      if (editingId) {
        res = await fetch(
          `/api/bookings/${encodeURIComponent(editingId)}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
        );
      } else {
        res = await fetch("/api/bookings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) throw new Error("Failed to save");

      const data = await res.json();

      if (!editingId && data.booking?.id) {
        setEditingId(data.booking.id);
        const url = new URL(window.location.href);
        url.searchParams.set("edit", data.booking.id);
        window.history.replaceState({}, "", url.toString());
      }

      setSaveMsg("Booking calendar saved successfully ✓");
    } catch (err) {
      console.warn("Failed to save booking:", err);
      setSaveMsg("Error saving — please try again.");
    } finally {
      setSaving(false);
    }
  }

  /* ================================================================
     RENDER
     ================================================================ */
  return (
    <>
        <header className="app-header">
          <div>
            <h1 className="app-company-name">ScheduleMuseAI</h1>
            <h2 className="app-page-name">Booking Calendar Builder</h2>
            <p className="app-subtitle">
              Design your booking calendar page — configure availability,
              customize the form, set up notifications, and brand your public
              booking page.
            </p>
          </div>
          <div className="app-cta">
            <Link href="/dashboard" className="btn-secondary">
              ← Back to dashboard
            </Link>
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="btn-primary"
            >
              {saving
                ? "Saving…"
                : editingId
                  ? "Update booking page"
                  : "Save booking page"}
            </button>
          </div>
        </header>

        {loading && (
          <div
            className="rounded-lg px-4 py-3 text-sm font-medium"
            style={{
              background: "var(--cal-hover)",
              color: "var(--cal-heading)",
            }}
          >
            Loading booking configuration…
          </div>
        )}

        {saveMsg && (
          <div
            className="rounded-lg px-4 py-3 text-sm font-medium flex items-center justify-between"
            style={{
              background:
                saveMsg.startsWith("Error") || saveMsg.startsWith("Could not")
                  ? "#ffe4e6"
                  : "var(--cal-hover)",
              color:
                saveMsg.startsWith("Error") || saveMsg.startsWith("Could not")
                  ? "#9f1239"
                  : "var(--cal-heading)",
            }}
          >
            <span>{saveMsg}</span>
            <button
              type="button"
              onClick={() => setSaveMsg(null)}
              className="ml-3 text-xs font-bold opacity-60 hover:opacity-100 transition-opacity"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        )}

        {/* Tab bar + content */}
        <div className="cal-grid">
          <div
            className="flex overflow-x-auto"
            style={{ borderBottom: "1px solid var(--cal-border)" }}
          >
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className="shrink-0 px-5 py-3.5 text-sm font-semibold transition-colors relative"
                style={{
                  color:
                    activeTab === tab.id
                      ? "var(--cal-primary)"
                      : "var(--cal-mid)",
                  background:
                    activeTab === tab.id ? "var(--cal-bg)" : "transparent",
                }}
              >
                <span className="mr-1.5">{tab.icon}</span>
                {tab.label}
                {activeTab === tab.id && (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-0.5"
                    style={{ background: "var(--cal-primary)" }}
                  />
                )}
              </button>
            ))}
          </div>

          {activeTab === "settings" && (
            <BookingSettingsTab
              config={config}
              update={update}
              isOpen={isOpen}
              toggle={toggle}
            />
          )}
          {activeTab === "form" && (
            <BookingFormTab config={config} update={update} />
          )}
          {activeTab === "notifications" && (
            <NotificationsTab config={config} update={update} />
          )}
          {activeTab === "page" && (
            <PageDesignerTab
              config={config}
              update={update}
              handleFileUpload={handleFileUpload}
              handleSave={handleSave}
              sampleContact={SAMPLE_CONTACT}
            />
          )}
          {activeTab === "embed" && (
            <EmbedDesignerTab config={config} update={update} />
          )}
          {activeTab === "phone" && (
            <PhoneSettingsTab config={config} update={update} />
          )}
        </div>
    </>
  );
}
