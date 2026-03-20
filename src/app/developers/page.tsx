"use client";

import { useEffect, useState } from "react";
import AppSidebar from "@/components/layout/AppSidebar";

type ApiKey = {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
};

type Webhook = {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  lastTriggeredAt: string | null;
  lastStatusCode: number | null;
  createdAt: string;
};

export default function DevelopersPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);

  /* New key form */
  const [showKeyForm, setShowKeyForm] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [newKeySecret, setNewKeySecret] = useState<string | null>(null);

  /* New webhook form */
  const [showWebhookForm, setShowWebhookForm] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookEvents, setWebhookEvents] = useState<string[]>(["meeting.created"]);
  const [newWebhookSecret, setNewWebhookSecret] = useState<string | null>(null);

  const AVAILABLE_EVENTS = [
    "meeting.created", "meeting.updated", "meeting.canceled",
    "meeting.completed", "contact.created", "booking_page.created",
  ];

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/developers");
      const json = await res.json();
      setApiKeys(json.apiKeys || []);
      setWebhooks(json.webhooks || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function createKey() {
    if (!keyName.trim()) return;
    const res = await fetch("/api/developers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "key", name: keyName }),
    });
    const json = await res.json();
    setNewKeySecret(json.apiKey?.key || null);
    setKeyName("");
    setShowKeyForm(false);
    load();
  }

  async function deleteKey(id: string) {
    if (!confirm("Revoke this API key? This cannot be undone.")) return;
    await fetch("/api/developers", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "key", id }),
    });
    load();
  }

  async function createWebhook() {
    if (!webhookUrl.trim()) return;
    const res = await fetch("/api/developers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "webhook", url: webhookUrl, events: webhookEvents }),
    });
    const json = await res.json();
    setNewWebhookSecret(json.webhook?.secret || null);
    setWebhookUrl("");
    setWebhookEvents(["meeting.created"]);
    setShowWebhookForm(false);
    load();
  }

  async function deleteWebhook(id: string) {
    if (!confirm("Delete this webhook endpoint?")) return;
    await fetch("/api/developers", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "webhook", id }),
    });
    load();
  }

  function toggleEvent(ev: string) {
    setWebhookEvents((prev) =>
      prev.includes(ev) ? prev.filter((e) => e !== ev) : [...prev, ev],
    );
  }

  return (
    <div className="app-layout">
      <AppSidebar />

      <main className="app-main">
        <header className="app-header">
          <div>
            <h1 className="app-company-name">ScheduleMuseAI</h1>
            <h2 className="app-page-name">Developers</h2>
            <p className="app-subtitle">
              Manage API keys and webhook endpoints for custom integrations.
            </p>
          </div>
        </header>

        {loading ? (
          <div className="p-12 text-center" style={{ color: "var(--cal-mid)" }}>Loading…</div>
        ) : (
          <>
            {/* ── API Keys ────────────────────────── */}
            <section className="card mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="card-title">API Keys</h3>
                <button onClick={() => setShowKeyForm(true)} className="btn-primary text-sm">+ Create key</button>
              </div>

              {/* Secret reveal banner */}
              {newKeySecret && (
                <div className="rounded-lg border p-4 mb-4" style={{ borderColor: "var(--cal-primary)", background: "var(--cal-hover)" }}>
                  <p className="text-sm font-semibold mb-1" style={{ color: "var(--cal-heading)" }}>
                    🔑 Your new API key (copy it now — it won't be shown again):
                  </p>
                  <code className="block rounded px-3 py-2 text-xs break-all font-mono"
                    style={{ background: "var(--cal-bg-alt)", color: "var(--cal-text)" }}>
                    {newKeySecret}
                  </code>
                  <button onClick={() => setNewKeySecret(null)} className="mt-2 text-xs font-semibold" style={{ color: "var(--cal-primary)" }}>
                    Dismiss
                  </button>
                </div>
              )}

              {apiKeys.length === 0 ? (
                <p className="text-sm" style={{ color: "var(--cal-mid)" }}>No API keys yet.</p>
              ) : (
                <table className="w-full text-sm" style={{ color: "var(--cal-text)" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid var(--cal-border)" }}>
                      <th className="text-left py-2 px-3 text-xs uppercase tracking-wide" style={{ color: "var(--cal-mid)" }}>Name</th>
                      <th className="text-left py-2 px-3 text-xs uppercase tracking-wide" style={{ color: "var(--cal-mid)" }}>Key</th>
                      <th className="text-left py-2 px-3 text-xs uppercase tracking-wide" style={{ color: "var(--cal-mid)" }}>Scopes</th>
                      <th className="text-left py-2 px-3 text-xs uppercase tracking-wide" style={{ color: "var(--cal-mid)" }}>Created</th>
                      <th className="text-right py-2 px-3 text-xs uppercase tracking-wide" style={{ color: "var(--cal-mid)" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apiKeys.map((k) => (
                      <tr key={k.id} className="cal-row" style={{ borderBottom: "1px solid var(--cal-border)" }}>
                        <td className="py-2 px-3 font-semibold" style={{ color: "var(--cal-heading)" }}>{k.name}</td>
                        <td className="py-2 px-3 font-mono text-xs">{k.keyPrefix}</td>
                        <td className="py-2 px-3">
                          {k.scopes.map((s) => (
                            <span key={s} className="inline-block rounded-full px-2 py-0.5 mr-1 text-[10px] font-medium"
                              style={{ background: "var(--cal-hover)", color: "var(--cal-primary)" }}>
                              {s}
                            </span>
                          ))}
                        </td>
                        <td className="py-2 px-3 text-xs">{new Date(k.createdAt).toLocaleDateString()}</td>
                        <td className="py-2 px-3 text-right">
                          <button onClick={() => deleteKey(k.id)} className="text-xs rounded px-2 py-1 hover:opacity-80" style={{ background: "#ffe4e6", color: "#9f1239" }}>
                            Revoke
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            {/* ── Webhooks ────────────────────────── */}
            <section className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="card-title">Webhooks</h3>
                <button onClick={() => setShowWebhookForm(true)} className="btn-primary text-sm">+ Add endpoint</button>
              </div>

              {newWebhookSecret && (
                <div className="rounded-lg border p-4 mb-4" style={{ borderColor: "var(--cal-primary)", background: "var(--cal-hover)" }}>
                  <p className="text-sm font-semibold mb-1" style={{ color: "var(--cal-heading)" }}>
                    🔐 Webhook signing secret (copy it now):
                  </p>
                  <code className="block rounded px-3 py-2 text-xs break-all font-mono"
                    style={{ background: "var(--cal-bg-alt)", color: "var(--cal-text)" }}>
                    {newWebhookSecret}
                  </code>
                  <button onClick={() => setNewWebhookSecret(null)} className="mt-2 text-xs font-semibold" style={{ color: "var(--cal-primary)" }}>
                    Dismiss
                  </button>
                </div>
              )}

              {webhooks.length === 0 ? (
                <p className="text-sm" style={{ color: "var(--cal-mid)" }}>No webhook endpoints configured.</p>
              ) : (
                <div className="space-y-3">
                  {webhooks.map((wh) => (
                    <div key={wh.id} className="rounded-xl border p-4 flex items-start justify-between gap-4"
                      style={{ borderColor: "var(--cal-border)", background: "var(--cal-bg)" }}>
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-sm truncate" style={{ color: "var(--cal-heading)" }}>{wh.url}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {wh.events.map((ev) => (
                            <span key={ev} className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                              style={{ background: "var(--cal-hover)", color: "var(--cal-primary)" }}>
                              {ev}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-xs" style={{ color: "var(--cal-mid)" }}>
                          <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: wh.active ? "var(--cal-primary)" : "var(--cal-border)" }} />
                            {wh.active ? "Active" : "Inactive"}
                          </span>
                          {wh.lastTriggeredAt && <span>Last fired: {new Date(wh.lastTriggeredAt).toLocaleString()}</span>}
                          {wh.lastStatusCode && <span>HTTP {wh.lastStatusCode}</span>}
                        </div>
                      </div>
                      <button onClick={() => deleteWebhook(wh.id)} className="text-xs rounded px-2 py-1 hover:opacity-80 flex-shrink-0" style={{ background: "#ffe4e6", color: "#9f1239" }}>
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {/* ── Create Key Modal ─────────── */}
        {showKeyForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="rounded-xl p-6 shadow-xl w-full max-w-md" style={{ background: "var(--cal-bg)" }}>
              <h3 className="text-lg font-bold mb-4" style={{ color: "var(--cal-heading)" }}>Create API Key</h3>
              <input value={keyName} onChange={(e) => setKeyName(e.target.value)} placeholder="Key name (e.g. Production)"
                className="w-full rounded-lg border px-3 py-2 text-sm mb-4"
                style={{ borderColor: "var(--cal-border)", background: "var(--cal-bg-alt)", color: "var(--cal-text)" }} />
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowKeyForm(false)} className="btn-secondary">Cancel</button>
                <button onClick={createKey} className="btn-primary">Create</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Create Webhook Modal ─────── */}
        {showWebhookForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="rounded-xl p-6 shadow-xl w-full max-w-md" style={{ background: "var(--cal-bg)" }}>
              <h3 className="text-lg font-bold mb-4" style={{ color: "var(--cal-heading)" }}>Add Webhook Endpoint</h3>
              <input value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} placeholder="https://your-server.com/webhook"
                className="w-full rounded-lg border px-3 py-2 text-sm mb-3"
                style={{ borderColor: "var(--cal-border)", background: "var(--cal-bg-alt)", color: "var(--cal-text)" }} />
              <p className="text-xs font-semibold mb-2" style={{ color: "var(--cal-mid)" }}>Events to listen for:</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {AVAILABLE_EVENTS.map((ev) => (
                  <button key={ev} onClick={() => toggleEvent(ev)}
                    className="rounded-full px-2.5 py-1 text-xs font-medium border cursor-pointer"
                    style={{
                      borderColor: webhookEvents.includes(ev) ? "var(--cal-primary)" : "var(--cal-border)",
                      background: webhookEvents.includes(ev) ? "var(--cal-hover)" : "transparent",
                      color: webhookEvents.includes(ev) ? "var(--cal-primary)" : "var(--cal-mid)",
                    }}>
                    {ev}
                  </button>
                ))}
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowWebhookForm(false)} className="btn-secondary">Cancel</button>
                <button onClick={createWebhook} className="btn-primary">Add</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
