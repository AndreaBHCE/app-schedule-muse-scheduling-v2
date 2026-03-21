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

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [newKeySecret, setNewKeySecret] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/developers");
      const json = await res.json();
      setApiKeys(json.apiKeys || []);
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
    setShowForm(false);
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

  return (
    <div className="app-layout">
      <AppSidebar />

      <main className="app-main">
        <header className="app-header">
          <div>
            <h1 className="app-company-name">ScheduleMuseAI</h1>
            <h2 className="app-page-name">API Keys</h2>
            <p className="app-subtitle">
              Create and manage API keys to connect external tools and services to your ScheduleMuseAI account.
            </p>
          </div>
        </header>

        {loading ? (
          <div className="p-12 text-center" style={{ color: "var(--cal-mid)" }}>Loading…</div>
        ) : (
          <section className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="card-title">Your API Keys</h3>
              <button onClick={() => setShowForm(true)} className="btn-primary text-sm">+ Create key</button>
            </div>

            {newKeySecret && (
              <div className="rounded-lg border p-4 mb-4" style={{ borderColor: "var(--cal-primary)", background: "var(--cal-hover)" }}>
                <p className="text-sm font-semibold mb-1" style={{ color: "var(--cal-heading)" }}>
                  🔑 Your new API key (copy it now — it won&apos;t be shown again):
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
              <p className="text-sm" style={{ color: "var(--cal-mid)" }}>No API keys yet. Create one to start integrating with external services.</p>
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
        )}

        {/* ── Create Key Modal ─────────── */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="rounded-xl p-6 shadow-xl w-full max-w-md" style={{ background: "var(--cal-bg)" }}>
              <h3 className="text-lg font-bold mb-4" style={{ color: "var(--cal-heading)" }}>Create API Key</h3>
              <input value={keyName} onChange={(e) => setKeyName(e.target.value)} placeholder="Key name (e.g. Production)"
                className="w-full rounded-lg border px-3 py-2 text-sm mb-4"
                style={{ borderColor: "var(--cal-border)", background: "var(--cal-bg-alt)", color: "var(--cal-text)" }} />
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
                <button onClick={createKey} className="btn-primary">Create</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
