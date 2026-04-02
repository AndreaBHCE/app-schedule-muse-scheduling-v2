"use client";

import { useEffect, useState, useRef } from "react";

type Contact = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  tags: string[];
  notes: string;
  totalMeetings: number;
  lastMeetingAt: string;
  createdAt: string;
};

type SortKey = "firstName" | "lastName" | "email" | "company" | "createdAt";
type SortDir = "asc" | "desc";

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState("");

  // Sort
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Add modal
  const [showAdd, setShowAdd] = useState(false);
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [newPhone, setNewPhone] = useState("");

  // Edit modal
  const [editContact, setEditContact] = useState<Contact | null>(null);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editCompany, setEditCompany] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  // 3-dot menu
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (selectedTag) params.set("tag", selectedTag);
      const res = await fetch(`/api/contacts?${params}`);
      const json = await res.json();
      setContacts(json.contacts || []);
    } catch (err) {
      console.warn("Failed to load contacts:", err);
      setContacts([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [search, selectedTag]);

  // Sort contacts client-side
  const sorted = [...contacts].sort((a, b) => {
    let av = "";
    let bv = "";
    if (sortKey === "firstName") { av = (a.firstName || "").toLowerCase(); bv = (b.firstName || "").toLowerCase(); }
    else if (sortKey === "lastName") { av = (a.lastName || "").toLowerCase(); bv = (b.lastName || "").toLowerCase(); }
    else if (sortKey === "email") { av = a.email.toLowerCase(); bv = b.email.toLowerCase(); }
    else if (sortKey === "company") { av = (a.company || "").toLowerCase(); bv = (b.company || "").toLowerCase(); }
    else if (sortKey === "createdAt") { av = a.createdAt || ""; bv = b.createdAt || ""; }
    if (av < bv) return sortDir === "asc" ? -1 : 1;
    if (av > bv) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function sortIndicator(key: SortKey) {
    if (sortKey !== key) return " ↕";
    return sortDir === "asc" ? " ↑" : " ↓";
  }

  async function addContact() {
    if (!newFirstName.trim() || !newLastName.trim() || !newEmail.trim()) return;
    await fetch("/api/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: newFirstName.trim(),
        lastName: newLastName.trim(),
        email: newEmail.trim(),
        company: newCompany,
        phone: newPhone,
      }),
    });
    setNewFirstName(""); setNewLastName(""); setNewEmail(""); setNewCompany(""); setNewPhone("");
    setShowAdd(false);
    load();
  }

  async function deleteContact(id: string) {
    if (!confirm("Delete this contact?")) return;
    await fetch(`/api/contacts/${id}`, {
      method: "DELETE",
    });
    setContacts((prev) => prev.filter((c) => c.id !== id));
    setOpenMenuId(null);
  }

  function openEdit(c: Contact) {
    setEditContact(c);
    setEditFirstName(c.firstName || "");
    setEditLastName(c.lastName || "");
    setEditEmail(c.email);
    setEditCompany(c.company || "");
    setEditPhone(c.phone || "");
    setOpenMenuId(null);
  }

  async function saveEdit() {
    if (!editContact) return;
    setEditSaving(true);
    try {
      await fetch(`/api/contacts/${editContact.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: editFirstName.trim(),
          lastName: editLastName.trim(),
          email: editEmail.trim(),
          company: editCompany.trim(),
          phone: editPhone.trim(),
        }),
      });
      setEditContact(null);
      load();
    } catch (err) {
      console.warn("Failed to update contact:", err);
    } finally {
      setEditSaving(false);
    }
  }

  function formatPhoneInput(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 10);
    if (digits.length > 6) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
    if (digits.length > 3) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return digits;
  }

  // Gather all unique tags
  const allTags = [...new Set(contacts.flatMap((c) => c.tags))].sort();

  return (
    <>
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

        {/* Filters + count */}
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
          <span className="ml-auto text-xs font-medium" style={{ color: "#ffffff" }}>
            {contacts.length} contact{contacts.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Contacts grid */}
        <section className="card">
          {loading ? (
            <div className="p-8 text-center" style={{ color: "var(--cal-mid)" }}>Loading contacts…</div>
          ) : contacts.length === 0 ? (
            <div className="p-8 text-center" style={{ color: "var(--cal-mid)" }}>No contacts found.</div>
          ) : (
            <div className="overflow-x-auto overflow-y-visible relative">
              <table className="w-full text-sm" style={{ color: "var(--cal-text)" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--cal-border)" }}>
                    <th className="text-left py-3 px-3 font-semibold text-xs uppercase tracking-wide cursor-pointer select-none" style={{ color: "white" }} onClick={() => toggleSort("firstName")}>First Name{sortIndicator("firstName")}</th>
                    <th className="text-left py-3 px-3 font-semibold text-xs uppercase tracking-wide cursor-pointer select-none" style={{ color: "white" }} onClick={() => toggleSort("lastName")}>Last Name{sortIndicator("lastName")}</th>
                    <th className="text-left py-3 px-3 font-semibold text-xs uppercase tracking-wide cursor-pointer select-none" style={{ color: "white" }} onClick={() => toggleSort("email")}>Email{sortIndicator("email")}</th>
                    <th className="text-left py-3 px-3 font-semibold text-xs uppercase tracking-wide cursor-pointer select-none" style={{ color: "white" }} onClick={() => toggleSort("company")}>Company{sortIndicator("company")}</th>
                    <th className="text-left py-3 px-3 font-semibold text-xs uppercase tracking-wide" style={{ color: "white" }}>Phone</th>
                    <th className="text-left py-3 px-3 font-semibold text-xs uppercase tracking-wide cursor-pointer select-none" style={{ color: "white" }} onClick={() => toggleSort("createdAt")}>Added{sortIndicator("createdAt")}</th>
                    <th className="text-right py-3 px-3 font-semibold text-xs uppercase tracking-wide" style={{ color: "white" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((c) => {
                    const firstName = c.firstName || "";
                    const lastName = c.lastName || "";
                    const added = c.createdAt ? new Date(c.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—";
                    return (
                      <tr key={c.id} className="cal-row" style={{ borderBottom: "1px solid var(--cal-border)" }}>
                        <td className="py-2 px-3 font-semibold" style={{ color: "white" }}>{firstName || "—"}</td>
                        <td className="py-2 px-3" style={{ color: "white" }}>{lastName || "—"}</td>
                        <td className="py-2 px-3" style={{ color: "white" }}>{c.email}</td>
                        <td className="py-2 px-3" style={{ color: "white" }}>{c.company || "—"}</td>
                        <td className="py-2 px-3" style={{ color: "white" }}>{c.phone || "—"}</td>
                        <td className="py-2 px-3 text-xs" style={{ color: "white" }}>{added}</td>
                        <td className="py-2 px-3 text-right relative">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === c.id ? null : c.id)}
                            className="text-lg leading-none px-2 py-1 rounded hover:opacity-80"
                            style={{ color: "white" }}
                            aria-label="Actions"
                          >
                            ⋯
                          </button>
                          {openMenuId === c.id && (
                            <div
                              ref={menuRef}
                              className="absolute right-0 bottom-full mb-1 z-50 rounded-lg shadow-xl border flex min-w-[200px]"
                              style={{ background: "#ffffff", borderColor: "#e0e0e0" }}
                            >
                              <button
                                onClick={() => openEdit(c)}
                                className="flex-1 text-center px-4 py-2.5 text-sm font-medium hover:opacity-80 rounded-l-lg"
                                style={{ color: "#0d4f4f", borderRight: "1px solid #e0e0e0" }}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => deleteContact(c.id)}
                                className="flex-1 text-center px-4 py-2.5 text-sm font-medium hover:opacity-80 rounded-r-lg"
                                style={{ color: "#0d4f4f" }}
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Add modal */}
        {showAdd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="rounded-xl p-6 shadow-xl w-full max-w-md" style={{ background: "var(--cal-bg)" }}>
              <h3 className="text-lg font-bold mb-4" style={{ color: "var(--cal-heading)" }}>Add Contact</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <input value={newFirstName} onChange={(e) => setNewFirstName(e.target.value)} placeholder="First name *" className="w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--cal-border)", background: "var(--cal-bg-alt)", color: "var(--cal-text)" }} />
                  <input value={newLastName} onChange={(e) => setNewLastName(e.target.value)} placeholder="Last name *" className="w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--cal-border)", background: "var(--cal-bg-alt)", color: "var(--cal-text)" }} />
                </div>
                <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="Email *" className="w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--cal-border)", background: "var(--cal-bg-alt)", color: "var(--cal-text)" }} />
                <input value={newCompany} onChange={(e) => setNewCompany(e.target.value)} placeholder="Company" className="w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--cal-border)", background: "var(--cal-bg-alt)", color: "var(--cal-text)" }} />
                <input value={newPhone} onChange={(e) => setNewPhone(formatPhoneInput(e.target.value))} placeholder="000-000-0000" className="w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--cal-border)", background: "var(--cal-bg-alt)", color: "var(--cal-text)" }} />
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button onClick={() => setShowAdd(false)} className="rounded-full px-5 py-3 text-sm font-semibold transition-opacity hover:opacity-90" style={{ background: "var(--cal-primary)", color: "#FFFFFF" }}>Cancel</button>
                <button onClick={addContact} className="btn-primary">Add</button>
              </div>
            </div>
          </div>
        )}

        {/* Edit modal */}
        {editContact && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="rounded-xl p-6 shadow-xl w-full max-w-md" style={{ background: "var(--cal-bg)" }}>
              <h3 className="text-lg font-bold mb-4" style={{ color: "var(--cal-heading)" }}>Edit Contact</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <input value={editFirstName} onChange={(e) => setEditFirstName(e.target.value)} placeholder="First name *" className="w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--cal-border)", background: "var(--cal-bg-alt)", color: "var(--cal-text)" }} />
                  <input value={editLastName} onChange={(e) => setEditLastName(e.target.value)} placeholder="Last name *" className="w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--cal-border)", background: "var(--cal-bg-alt)", color: "var(--cal-text)" }} />
                </div>
                <input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder="Email *" className="w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--cal-border)", background: "var(--cal-bg-alt)", color: "var(--cal-text)" }} />
                <input value={editCompany} onChange={(e) => setEditCompany(e.target.value)} placeholder="Company" className="w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--cal-border)", background: "var(--cal-bg-alt)", color: "var(--cal-text)" }} />
                <input value={editPhone} onChange={(e) => setEditPhone(formatPhoneInput(e.target.value))} placeholder="000-000-0000" className="w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--cal-border)", background: "var(--cal-bg-alt)", color: "var(--cal-text)" }} />
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button onClick={() => setEditContact(null)} className="rounded-full px-5 py-3 text-sm font-semibold transition-opacity hover:opacity-90" style={{ background: "var(--cal-primary)", color: "#FFFFFF" }} disabled={editSaving}>Cancel</button>
                <button onClick={saveEdit} className="btn-primary" disabled={editSaving}>{editSaving ? "Saving…" : "Save"}</button>
              </div>
            </div>
          </div>
        )}
    </>
  );
}
