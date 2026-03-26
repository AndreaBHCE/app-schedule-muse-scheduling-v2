"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useToast } from "@/components/ui/toast";

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
  { key: "zoom",            name: "Zoom",              description: "Create meeting links for bookings.",      icon: "/zoom_icon_1.png", category: "meeting" },
  { key: "google_meet",     name: "Google Meet",       description: "Create meeting links for bookings.",      icon: "/google_meets_icon_1.png", category: "meeting" },
  { key: "microsoft_teams", name: "Microsoft Teams",   description: "Create meeting links for bookings.",      icon: "/microsoft_teams_icon_1.png", category: "meeting" },
  { key: "goto_meeting",    name: "GoTo Meeting",      description: "Create meeting links for bookings.",      icon: "/goto_meeting_icon_1.png", category: "meeting" },
  // Email providers
  { key: "gmail",           name: "Gmail",             description: "Send booking emails.",                    icon: "/gmail_icon_1.png", category: "email" },
  { key: "outlook_email",   name: "Outlook",           description: "Send booking emails.",                    icon: "/outlook_icon_1.png", category: "email" },
  { key: "smtp",            name: "Other Email",       description: "Connect any email provider to send booking emails.", icon: "/smtp_email_icon_1.png", category: "email" },
  // Calendar providers
  { key: "google_calendar", name: "Google Calendar",   description: "Write events to this calendar.",          icon: "/google_calendar_icon_1.png", category: "calendar" },
  { key: "outlook_calendar",name: "Outlook Calendar",  description: "Write events to this calendar.",          icon: "/outlook_calendar_icon_1.png", category: "calendar" },
];

const STATUS_STYLES: Record<string, { text: string; dot: string }> = {
  connected:    { text: "var(--cal-primary)",  dot: "var(--cal-primary)" },
  disconnected: { text: "var(--cal-mid)",      dot: "var(--cal-border)" },
  error:        { text: "#e11d48",             dot: "#e11d48" },
};

export default function IntegrationsPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [smtpModal, setSmtpModal] = useState(false);
  const [smtpProvider, setSmtpProvider] = useState("");
  const [smtpForm, setSmtpForm] = useState({
    host: "", port: "587", username: "", password: "", from_email: "", encryption: "tls",
  });
  const [smtpLoading, setSmtpLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const SMTP_PRESETS: Record<string, { host: string; port: string; encryption: string; label: string; help?: string }> = {
    yahoo:    { host: "smtp.mail.yahoo.com",   port: "465", encryption: "tls",      label: "Yahoo Mail" },
    zoho:     { host: "smtp.zoho.com",          port: "465", encryption: "tls",      label: "Zoho Mail" },
    fastmail: { host: "smtp.fastmail.com",      port: "465", encryption: "tls",      label: "Fastmail" },
    icloud:   { host: "smtp.mail.me.com",       port: "587", encryption: "starttls", label: "iCloud Mail", help: "Requires an app-specific password. Go to appleid.apple.com → Sign-In and Security → App-Specific Passwords." },
    aol:      { host: "smtp.aol.com",           port: "465", encryption: "tls",      label: "AOL Mail" },
    other:    { host: "",                        port: "587", encryption: "tls",      label: "Other provider" },
  };

  function selectSmtpProvider(key: string) {
    setSmtpProvider(key);
    const preset = SMTP_PRESETS[key];
    if (preset) {
      setSmtpForm((f) => ({ ...f, host: preset.host, port: preset.port, encryption: preset.encryption }));
    }
  }

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/integrations");
      const json = await res.json();
      setIntegrations(json.integrations || []);
    } catch (err) {
      console.warn("Failed to load integrations:", err);
      setIntegrations([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();

    // Check for OAuth success/error messages in URL
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get("success");
    const error = urlParams.get("error");

    if (success === "zoom_connected") {
      window.history.replaceState({}, "", "/integrations");
      toast("Zoom connected successfully!", "success");
      load();
    } else if (success === "gmail_connected") {
      window.history.replaceState({}, "", "/integrations");
      toast("Gmail connected successfully!", "success");
      load();
    } else if (error) {
      const details = urlParams.get("details");
      window.history.replaceState({}, "", "/integrations");
      toast(
        `Connection failed: ${error}${details ? " — " + decodeURIComponent(details) : ""}`,
        "error",
        6000,
      );
    }
  }, []);

  function getStatus(providerKey: string): Integration | undefined {
    return integrations.find((i) => i.provider === providerKey);
  }

  async function toggleConnect(providerKey: string) {
    const existing = getStatus(providerKey);

    // Special handling for Zoom OAuth
    if (providerKey === "zoom") {
      if (existing && existing.status === "connected") {
        await fetch("/api/integrations", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: existing.id, status: "disconnected" }),
        });
        load();
      } else {
        initiateOAuth("zoom");
      }
      return;
    }

    // Special handling for Gmail OAuth
    if (providerKey === "gmail") {
      if (existing && existing.status === "connected") {
        await fetch("/api/integrations", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: existing.id, status: "disconnected" }),
        });
        load();
      } else {
        initiateOAuth("gmail");
      }
      return;
    }

    // Special handling for SMTP — open credential form
    if (providerKey === "smtp") {
      if (existing && existing.status === "connected") {
        await fetch("/api/integrations", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: existing.id, status: "disconnected" }),
        });
        load();
      } else {
        setSmtpProvider("");
        setSmtpForm({ host: "", port: "587", username: "", password: "", from_email: "", encryption: "tls" });
        setSmtpModal(true);
      }
      return;
    }

    // Default behavior for other providers
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

  async function initiateOAuth(provider: string) {
    const label = provider === "gmail" ? "Gmail" : provider === "zoom" ? "Zoom" : provider;
    try {
      const res = await fetch("/api/integrations/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        toast(json.error || `Failed to start ${label} connection`, "error");
        return;
      }
      const { url } = await res.json();
      window.location.href = url;
    } catch (err) {
      console.warn(`Failed to initiate ${label} OAuth:`, err);
      toast(`Could not connect to ${label} — please try again.`, "error");
    }
  }

  async function submitSmtp() {
    setSmtpLoading(true);
    try {
      const res = await fetch("/api/integrations/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "smtp", ...smtpForm, port: Number(smtpForm.port) }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast(json.error || "Failed to connect email", "error", 6000);
        return;
      }
      toast("Email connected successfully!", "success");
      setSmtpModal(false);
      load();
    } catch (err) {
      console.warn("SMTP connect error:", err);
      toast("Could not connect email — please try again.", "error");
    } finally {
      setSmtpLoading(false);
    }
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
                    <img src={p.icon} alt={p.name} className="w-8 h-8 object-contain" />
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
                    {integration?.config && typeof integration.config === 'string' && (
                      <span className="text-xs text-gray-500">
                        ({JSON.parse(integration.config as unknown as string).account_type || 'Basic'})
                      </span>
                    )}
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
    <>
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

        {/* Connect Your Email Modal */}
        {smtpModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="rounded-xl p-6 w-full max-w-md shadow-2xl" style={{ background: "var(--cal-bg)", border: "1px solid var(--cal-border)" }}>
              <h3 className="text-lg font-bold mb-1" style={{ color: "var(--cal-heading)" }}>Connect Your Email</h3>
              <p className="text-sm mb-5" style={{ color: "var(--cal-mid)" }}>Send booking confirmations and reminders from your own email address.</p>

              <div className="space-y-3">
                {/* Provider selector */}
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--cal-text)" }}>Email Provider</label>
                  <select value={smtpProvider}
                    onChange={(e) => selectSmtpProvider(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: "var(--cal-surface)", border: "1px solid var(--cal-border)", color: "var(--cal-text)" }}>
                    <option value="" disabled>Choose your email provider…</option>
                    {Object.entries(SMTP_PRESETS).map(([key, preset]) => (
                      <option key={key} value={key}>{preset.label}</option>
                    ))}
                  </select>
                </div>

                {/* Fields shown after provider selection */}
                {smtpProvider && (
                  <>
                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: "var(--cal-text)" }}>Your Email Address</label>
                      <input type="email" placeholder="you@example.com" value={smtpForm.from_email}
                        onChange={(e) => setSmtpForm({ ...smtpForm, from_email: e.target.value, username: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: "var(--cal-surface)", border: "1px solid var(--cal-border)", color: "var(--cal-text)" }} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: "var(--cal-text)" }}>Password</label>
                      <div className="relative">
                        <input type={showPassword ? "text" : "password"} placeholder="••••••••" value={smtpForm.password}
                          onChange={(e) => setSmtpForm({ ...smtpForm, password: e.target.value })}
                          className="w-full px-3 py-2 pr-10 rounded-lg text-sm" style={{ background: "var(--cal-surface)", border: "1px solid var(--cal-border)", color: "var(--cal-text)" }} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1" style={{ color: "var(--cal-mid)" }}
                          aria-label={showPassword ? "Hide password" : "Show password"}>
                          {showPassword ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                          )}
                        </button>
                      </div>
                      <p className="text-xs mt-1" style={{ color: "var(--cal-mid)" }}>
                        Use your email password or app-specific password if your provider requires one.
                      </p>
                    </div>

                    {/* Provider-specific help text */}
                    {SMTP_PRESETS[smtpProvider]?.help && (
                      <div className="rounded-lg px-3 py-2 text-xs" style={{ background: "var(--cal-surface)", color: "var(--cal-mid)" }}>
                        💡 {SMTP_PRESETS[smtpProvider].help}
                      </div>
                    )}

                    {/* Advanced fields for "Other" provider only */}
                    {smtpProvider === "other" && (
                      <>
                        <div>
                          <label className="block text-xs font-medium mb-1" style={{ color: "var(--cal-text)" }}>Server Address</label>
                          <input type="text" placeholder="smtp.example.com" value={smtpForm.host}
                            onChange={(e) => setSmtpForm({ ...smtpForm, host: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: "var(--cal-surface)", border: "1px solid var(--cal-border)", color: "var(--cal-text)" }} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium mb-1" style={{ color: "var(--cal-text)" }}>Server Port</label>
                            <input type="number" placeholder="587" value={smtpForm.port}
                              onChange={(e) => setSmtpForm({ ...smtpForm, port: e.target.value })}
                              className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: "var(--cal-surface)", border: "1px solid var(--cal-border)", color: "var(--cal-text)" }} />
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1" style={{ color: "var(--cal-text)" }}>Security</label>
                            <select value={smtpForm.encryption}
                              onChange={(e) => setSmtpForm({ ...smtpForm, encryption: e.target.value })}
                              className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: "var(--cal-surface)", border: "1px solid var(--cal-border)", color: "var(--cal-text)" }}>
                              <option value="tls">TLS</option>
                              <option value="starttls">STARTTLS</option>
                              <option value="none">None</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1" style={{ color: "var(--cal-text)" }}>Username</label>
                          <input type="text" placeholder="Usually your email address" value={smtpForm.username}
                            onChange={(e) => setSmtpForm({ ...smtpForm, username: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: "var(--cal-surface)", border: "1px solid var(--cal-border)", color: "var(--cal-text)" }} />
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setSmtpModal(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium" style={{ color: "var(--cal-text)" }}>
                  Cancel
                </button>
                {smtpProvider && (
                  <button onClick={submitSmtp} disabled={smtpLoading}
                    className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                    style={{ background: "var(--cal-primary)" }}>
                    {smtpLoading ? "Connecting…" : "Connect"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
    </>
  );
}
