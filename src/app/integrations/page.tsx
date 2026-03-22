"use client";

import { useEffect, useState } from "react";
import AppSidebar from "@/components/layout/AppSidebar";

type Integration = {
  id: string;
  provider: string;
  status: string;
  externalId: string;
  config: Record<string, unknown>;
  lastSyncedAt: string;
  createdAt: string;
};

type ProviderInfo = {
  key: string;
  name: string;
  description: string;
  icon: string;
  category: "meeting" | "email" | "calendar";
};

const PROVIDERS: ProviderInfo[] = [
  // Meeting providers
  { key: "zoom",            name: "Zoom",              description: "Create meeting links for bookings.",      icon: "🎥", category: "meeting" },
  { key: "google_meet",     name: "Google Meet",       description: "Create meeting links for bookings.",      icon: "📹", category: "meeting" },
  { key: "microsoft_teams", name: "Microsoft Teams",   description: "Create meeting links for bookings.",      icon: "💬", category: "meeting" },
  // Email providers
  { key: "gmail",           name: "Gmail",             description: "Send booking emails.",                    icon: "✉️", category: "email" },
  { key: "outlook_email",   name: "Outlook",           description: "Send booking emails.",                    icon: "📧", category: "email" },
  { key: "smtp",            name: "SMTP",              description: "Send booking emails.",                    icon: "📨", category: "email" },
  // Calendar providers
  { key: "google_calendar", name: "Google Calendar",   description: "Write events to this calendar.",          icon: "📅", category: "calendar" },
  { key: "outlook_calendar",name: "Outlook Calendar",  description: "Write events to this calendar.",          icon: "🗓️", category: "calendar" },
];

const STATUS_STYLES: Record<string, { text: string; dot: string }> = {
  connected:    { text: "var(--cal-primary)",  dot: "var(--cal-primary)" },
  disconnected: { text: "var(--cal-mid)",      dot: "var(--cal-border)" },
  error:        { text: "#e11d48",             dot: "#e11d48" },
};

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/integrations");
      const json = await res.json();
      setIntegrations(json.integrations || []);
    } catch {
      setIntegrations([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function getStatus(providerKey: string): Integration | undefined {
    return integrations.find((i) => i.provider === providerKey);
  }

  async function toggleConnect(providerKey: string) {
    const existing = getStatus(providerKey);
    if (existing && existing.status === "connected") {
      // Disconnect
      await fetch("/api/integrations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: existing.id, status: "disconnected" }),
      });
    } else if (existing) {
      // Reconnect
      await fetch("/api/integrations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: existing.id, status: "connected" }),
      });
    } else {
      // Create new connection
      await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: providerKey }),
      });
    }
    load();
  }

  function renderCategory(title: string, subtitle: string, category: "meeting" | "email" | "calendar") {
    const providers = PROVIDERS.filter((p) => p.category === category);
    return (
      <div className="mb-8">
        <h3 className="text-lg font-bold mb-1 integrations-category-title">{title}</h3>
        <p className="text-sm mb-4" style={{ color: "var(--cal-mid)" }}>{subtitle}</p>
        <div className={`grid gap-4 ${category === "calendar" ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}>
          {providers.map((p) => {
            const integration = getStatus(p.key);
            const status = integration?.status || "disconnected";
            const style = STATUS_STYLES[status] || STATUS_STYLES.disconnected;
            return (
              <div key={p.key} className="rounded-xl border p-5 flex flex-col justify-between"
                style={{ borderColor: "var(--cal-border)", background: "var(--cal-bg)" }}>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{p.icon}</span>
                    <h4 className="font-semibold" style={{ color: "var(--cal-heading)" }}>{p.name}</h4>
                  </div>
                  <p className="text-sm mb-4" style={{ color: "var(--cal-text)" }}>{p.description}</p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: style.dot }} />
                    <span className="text-xs font-medium capitalize" style={{ color: style.text }}>
                      Status: {status === "connected" ? "Connected" : "Not connected"}
                    </span>
                  </div>
                  <button
                    onClick={() => toggleConnect(p.key)}
                    className="text-sm font-semibold cursor-pointer"
                    style={{ color: "var(--cal-primary)" }}
                  >
                    Manage
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <AppSidebar />

      <main className="app-main">
        <header className="app-header">
          <div>
            <h1 className="app-company-name">ScheduleMuseAI</h1>
            <h2 className="app-page-name">Integrations</h2>
            <p className="app-subtitle">
              Connect the tools that power your scheduling experience.
            </p>
          </div>
        </header>

        {loading ? (
          <div className="p-12 text-center" style={{ color: "var(--cal-mid)" }}>Loading integrations…</div>
        ) : (
          <div>
            {renderCategory(
              "Meeting providers",
              "Click a provider to connect and allow booking links to be created automatically.",
              "meeting",
            )}
            {renderCategory(
              "Email providers",
              "Select the service that sends booking confirmations and reminders.",
              "email",
            )}
            {renderCategory(
              "Calendar providers",
              "Choose where booked events should appear.",
              "calendar",
            )}
          </div>
        )}
      </main>
    </div>
  );
}
