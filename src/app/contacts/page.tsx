"use client";

import { useEffect, useState } from "react";
import AppSidebar from "@/components/layout/AppSidebar";

type Contact = {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  tags: string[];
  notes: string;
  totalMeetings: number;
  lastMeetingAt: string;
  createdAt: string;
};

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [newPhone, setNewPhone] = useState("");

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (selectedTag) params.set("tag", selectedTag);
      const res = await fetch(`/api/contacts?${params}`);
      const json = await res.json();
      setContacts(json.contacts || []);
    } catch {
      setContacts([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [search, selectedTag]);

  async function addContact() {
    if (!newName.trim() || !newEmail.trim()) return;
    await fetch("/api/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, email: newEmail, company: newCompany, phone: newPhone }),
    });
    setNewName(""); setNewEmail(""); setNewCompany(""); setNewPhone("");
    setShowAdd(false);
    load();
  }

  async function deleteContact(id: string) {
    if (!confirm("Delete this contact?")) return;
    await fetch("/api/contacts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setContacts((prev) => prev.filter((c) => c.id !== id));
  }

  // Gather all unique tags
  const allTags = [...new Set(contacts.flatMap((c) => c.tags))].sort();

  return (
    <div className="app-layout">
      <AppSidebar />

      <main className="app-main">
        <header className="app-header">
          <div>
            <h1 className="app-company-name">ScheduleMuseAI</h1>
            <h2 className="app-page-name">Contacts</h2>
            <p className="app-subtitle">
              Everyone who has booked with you — search, tag, and track meeting history.
            </p>
          </div>
          <div className="app-cta">
            <button onClick={() => setShowAdd(true)} className="btn-primary">+ Add contact</button>
          </div>
        </header>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <input
            type="text"
            placeholder="Search by name, email, or company…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm w-72"
            style={{ borderColor: "var(--cal-border)", background: "var(--cal-bg)", color: "var(--cal-text)" }}
          />
          {allTags.length > 0 && (
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: "var(--cal-border)", background: "var(--cal-bg)", color: "var(--cal-text)" }}
            >
              <option value="">All tags</option>
              {allTags.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          )}
        </div>

        {/* Contacts grid */}
        <section className="card">
          {loading ? (
            <div className="p-8 text-center" style={{ color: "var(--cal-mid)" }}>Loading contacts…</div>
          ) : contacts.length === 0 ? (
            <div className="p-8 text-center" style={{ color: "var(--cal-mid)" }}>No contacts found.</div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {contacts.map((c) => (
                <article key={c.id} className="rounded-xl border p-4" style={{ borderColor: "var(--cal-border)", background: "var(--cal-bg)" }}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-semibold" style={{ color: "var(--cal-heading)" }}>{c.name}</h4>
                      <p className="text-xs" style={{ color: "var(--cal-mid)" }}>{c.email}</p>
                    </div>
                    <button onClick={() => deleteContact(c.id)} className="text-xs rounded px-2 py-1 hover:opacity-80" style={{ background: "#ffe4e6", color: "#9f1239" }}>
                      ×
                    </button>
                  </div>

                  {c.company && (
                    <p className="text-sm mt-1" style={{ color: "var(--cal-text)" }}>{c.company}</p>
                  )}
                  {c.phone && (
                    <p className="text-xs mt-0.5" style={{ color: "var(--cal-mid)" }}>{c.phone}</p>
                  )}

                  <div className="flex flex-wrap gap-1 mt-2">
                    {c.tags.map((tag) => (
                      <span key={tag} className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                        style={{ background: "var(--cal-hover)", color: "var(--cal-primary)" }}>
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-2 text-xs" style={{ borderTop: "1px solid var(--cal-border)", color: "var(--cal-mid)" }}>
                    <span>{c.totalMeetings} meeting{c.totalMeetings !== 1 ? "s" : ""}</span>
                    {c.lastMeetingAt && (
                      <span>Last: {new Date(c.lastMeetingAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Add modal */}
        {showAdd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="rounded-xl p-6 shadow-xl w-full max-w-md" style={{ background: "var(--cal-bg)" }}>
              <h3 className="text-lg font-bold mb-4" style={{ color: "var(--cal-heading)" }}>Add Contact</h3>
              <div className="space-y-3">
                <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Full name *" className="w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--cal-border)", background: "var(--cal-bg-alt)", color: "var(--cal-text)" }} />
                <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="Email *" className="w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--cal-border)", background: "var(--cal-bg-alt)", color: "var(--cal-text)" }} />
                <input value={newCompany} onChange={(e) => setNewCompany(e.target.value)} placeholder="Company" className="w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--cal-border)", background: "var(--cal-bg-alt)", color: "var(--cal-text)" }} />
                <input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="Phone" className="w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--cal-border)", background: "var(--cal-bg-alt)", color: "var(--cal-text)" }} />
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button onClick={() => setShowAdd(false)} className="btn-secondary">Cancel</button>
                <button onClick={addContact} className="btn-primary">Add</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
