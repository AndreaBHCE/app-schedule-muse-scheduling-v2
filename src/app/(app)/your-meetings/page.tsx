"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Meeting = {
  id: string;
  bookingPageId: string;
  meetingType: string;
  guestName: string;
  guestEmail: string;
  startTime: string;
  endTime: string;
  status: string;
  locationType: string;
  locationDetails: string;
  notes: string;
  canceledReason: string;
  createdAt: string;
};

type BookingCalendar = {
  id: string;
  title: string;
  durationMinutes: number;
  status: "Published" | "Draft" | "Paused";
  bookingsLast7Days: number;
  color: string;
  locationType: string;
  locationDetails: string;
};

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  confirmed:  { bg: "var(--cal-hover)",  text: "var(--cal-heading)", dot: "var(--cal-primary)" },
  pending:    { bg: "#fef3c7",           text: "#92400e",            dot: "#f59e0b" },
  completed:  { bg: "var(--cal-bg-alt)", text: "var(--cal-text)",    dot: "var(--cal-mid)" },
  canceled:   { bg: "#ffe4e6",           text: "#9f1239",            dot: "#f43f5e" },
  "no-show":  { bg: "#fef3c7",           text: "#92400e",            dot: "#f97316" },
};

type Tab = "upcoming" | "past" | "canceled" | "all";

export default function YourMeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("upcoming");
  const [page, setPage] = useState(1);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const limit = 10;

  /* ── Add Meeting modal state ── */
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    calendarId: "",
    firstName: "",
    lastName: "",
    email: "",
    date: "",
    time: "",
    location: "virtual" as string,
    locationDetails: "",
    notes: "",
  });
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const [calendars, setCalendars] = useState<BookingCalendar[]>([]);
  const [calendarsLoading, setCalendarsLoading] = useState(true);

  /* Load booking calendars once */
  useEffect(() => {
    let dead = false;
    async function loadCalendars() {
      try {
        const res = await fetch("/api/bookings?limit=50");
        const json = await res.json();
        if (!dead) setCalendars(json.bookings || []);
      } catch {
        if (!dead) setCalendars([]);
      } finally {
        if (!dead) setCalendarsLoading(false);
      }
    }
    loadCalendars();
    return () => { dead = true; };
  }, []);

  useEffect(() => {
    let dead = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/meetings?status=${tab}&page=${page}&limit=${limit}`);
        const json = await res.json();
        if (!dead) {
          setMeetings(json.meetings || []);
          setTotal(json.total || 0);
        }
      } catch (err) {
        console.warn("Failed to load meetings:", err);
        if (!dead) setMeetings([]);
      } finally {
        if (!dead) setLoading(false);
      }
    }
    load();
    return () => { dead = true; };
  }, [tab, page]);

  async function cancelMeeting() {
    if (!cancelId) return;
    await fetch("/api/meetings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: cancelId, status: "canceled", canceledReason: cancelReason }),
    });
    setCancelId(null);
    setCancelReason("");
    setMeetings((prev) => prev.map((m) => m.id === cancelId ? { ...m, status: "canceled" } : m));
  }

  /* ── Add Meeting submit ── */
  function openAddModal() {
    const defaultCal = calendars.length > 0 ? calendars[0] : null;
    setAddForm({
      calendarId: defaultCal?.id || "",
      firstName: "",
      lastName: "",
      email: "",
      date: new Date().toISOString().split("T")[0],
      time: "09:00",
      location: defaultCal?.locationType || "virtual",
      locationDetails: defaultCal?.locationDetails || "",
      notes: "",
    });
    setAddError(null);
    setShowAddModal(true);
  }

  function handleCalendarChange(calId: string) {
    const cal = calendars.find((c) => c.id === calId);
    setAddForm((prev) => ({
      ...prev,
      calendarId: calId,
      location: cal?.locationType || prev.location,
      locationDetails: cal?.locationDetails || prev.locationDetails,
    }));
  }

  async function submitAddMeeting() {
    setAddError(null);
    const { calendarId, firstName, lastName, email, date, time, location, locationDetails, notes } = addForm;

    if (!firstName.trim()) { setAddError("First name is required."); return; }
    if (!lastName.trim()) { setAddError("Last name is required."); return; }
    if (!email.trim() || !email.includes("@")) { setAddError("Valid email is required."); return; }
    if (!date || !time) { setAddError("Date and time are required."); return; }

    const selectedCal = calendars.find((c) => c.id === calendarId);
    const duration = selectedCal?.durationMinutes || 30;
    const startTime = new Date(`${date}T${time}:00`);
    const endTime = new Date(startTime.getTime() + duration * 60 * 1000);

    setAddSubmitting(true);
    try {
      // 1. Auto-create contact if not exists
      await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          tags: ["auto-created"],
        }),
      });
      // Ignore errors (contact may already exist)

      // 2. Create the meeting
      const guestName = `${firstName.trim()} ${lastName.trim()}`;
      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_page_id: calendarId || undefined,
          guest_name: guestName,
          guest_email: email.trim(),
          meeting_type: selectedCal?.title || "Meeting",
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          location,
          location_details: locationDetails,
          notes,
        }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Failed to create meeting");
      }

      setShowAddModal(false);
      // Refresh the meetings list
      setPage(1);
      setTab("upcoming");
    } catch (err) {
      setAddError((err as Error).message);
    } finally {
      setAddSubmitting(false);
    }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "upcoming", label: "Upcoming" },
    { key: "past",     label: "Past" },
    { key: "canceled", label: "Canceled" },
    { key: "all",      label: "All" },
  ];

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <>
        <header className="app-header">
          <div>
            <h1 className="app-company-name">ScheduleMuseAI</h1>
            <h2 className="app-page-name">Your Meetings</h2>
            <p className="app-subtitle">
              View, filter, and manage all your scheduled meetings in one place.
            </p>
          </div>
          <div className="app-cta flex gap-2">
            <button onClick={openAddModal} className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-90" style={{ border: "1.5px solid var(--cal-primary)", color: "var(--cal-primary)", background: "transparent" }}>+ Add meeting</button>
            <Link href="/meeting-setup" className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-90" style={{ background: "var(--cal-primary)", color: "white" }}>+ New booking page</Link>
          </div>
        </header>

        {/* Booking calendar cards */}
        {!calendarsLoading && calendars.length > 0 && (
          <div className={`mb-6 grid gap-3 ${calendars.length === 1 ? "grid-cols-1" : calendars.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
            {calendars.map((cal) => {
              const statusDot =
                cal.status === "Published" ? "var(--cal-primary)"
                  : cal.status === "Draft" ? "#f59e0b"
                    : "var(--cal-mid)";
              return (
                <Link
                  key={cal.id}
                  href={`/meeting-setup?edit=${cal.id}`}
                  className="rounded-xl border px-6 py-5 transition-shadow hover:shadow-lg"
                  style={{
                    borderColor: "var(--cal-border)",
                    background: "var(--cal-bg)",
                    borderLeft: `4px solid ${cal.color || "var(--cal-primary)"}`,
                  }}
                >
                  <div className="flex items-center gap-2.5 mb-3">
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ background: statusDot }}
                      title={cal.status}
                    />
                    <span
                      className="font-bold truncate"
                      style={{ color: "var(--cal-heading)", fontSize: 17 }}
                    >
                      {cal.title}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm" style={{ color: "var(--cal-mid)" }}>
                      {cal.durationMinutes} min · {cal.status}
                    </span>
                    <span className="text-lg font-bold" style={{ color: "var(--cal-primary)" }}>
                      {cal.bookingsLast7Days} <span className="text-xs font-normal" style={{ color: "var(--cal-mid)" }}>bookings (7d)</span>
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-4">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setPage(1); }}
              className={`cal-view-btn ${tab === t.key ? "cal-view-btn--active" : ""}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <section className="card overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center" style={{ color: "var(--cal-mid)" }}>Loading meetings…</div>
          ) : meetings.length === 0 ? (
            <div className="p-8 text-center" style={{ color: "var(--cal-mid)" }}>No meetings found.</div>
          ) : (
            <table className="w-full text-sm" style={{ color: "var(--cal-text)" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--cal-border)" }}>
                  <th className="text-left py-3 px-3 font-semibold text-xs uppercase tracking-wide" style={{ color: "var(--cal-mid)" }}>Guest</th>
                  <th className="text-left py-3 px-3 font-semibold text-xs uppercase tracking-wide" style={{ color: "var(--cal-mid)" }}>Type</th>
                  <th className="text-left py-3 px-3 font-semibold text-xs uppercase tracking-wide" style={{ color: "var(--cal-mid)" }}>Date &amp; Time</th>
                  <th className="text-left py-3 px-3 font-semibold text-xs uppercase tracking-wide" style={{ color: "var(--cal-mid)" }}>Location</th>
                  <th className="text-left py-3 px-3 font-semibold text-xs uppercase tracking-wide" style={{ color: "var(--cal-mid)" }}>Status</th>
                  <th className="text-right py-3 px-3 font-semibold text-xs uppercase tracking-wide" style={{ color: "var(--cal-mid)" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {meetings.map((m) => {
                  const s = STATUS_STYLES[m.status] || STATUS_STYLES.confirmed;
                  const dt = new Date(m.startTime);
                  return (
                    <tr key={m.id} className="cal-row" style={{ borderBottom: "1px solid var(--cal-border)" }}>
                      <td className="py-3 px-3">
                        <div className="font-semibold" style={{ color: "var(--cal-heading)" }}>{m.guestName}</div>
                        <div className="text-xs" style={{ color: "var(--cal-mid)" }}>{m.guestEmail}</div>
                      </td>
                      <td className="py-3 px-3" style={{ color: "#ffffff" }}>{m.meetingType}</td>
                      <td className="py-3 px-3" style={{ color: "#ffffff" }}>
                        <div>{dt.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</div>
                        <div className="text-xs" style={{ color: "var(--cal-mid)" }}>
                          {dt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                        </div>
                      </td>
                      <td className="py-3 px-3" style={{ color: "#ffffff" }}>
                        <span className="text-xs">{m.locationType}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
                          style={{ background: s.bg, color: s.text }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />
                          {m.status.charAt(0).toUpperCase() + m.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {["confirmed", "pending"].includes(m.status) && (
                          <button
                            onClick={() => setCancelId(m.id)}
                            className="rounded px-3 py-1 text-xs font-semibold hover:opacity-80"
                            style={{ background: "#ffe4e6", color: "#9f1239" }}
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-3 py-3" style={{ borderTop: "1px solid var(--cal-border)" }}>
              <span className="text-xs" style={{ color: "var(--cal-mid)" }}>
                Page {page} of {totalPages} · {total} meetings
              </span>
              <div className="flex gap-1">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="cal-nav-btn" aria-label="Previous page">
                  ←
                </button>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="cal-nav-btn" aria-label="Next page">
                  →
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Cancel modal */}
        {cancelId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="rounded-xl p-6 shadow-xl w-full max-w-md" style={{ background: "var(--cal-bg)" }}>
              <h3 className="text-lg font-bold mb-2" style={{ color: "var(--cal-heading)" }}>Cancel Meeting</h3>
              <p className="text-sm mb-3" style={{ color: "var(--cal-text)" }}>
                Are you sure you want to cancel this meeting? This cannot be undone.
              </p>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Reason for cancellation (optional)"
                rows={3}
                className="w-full rounded-lg border px-3 py-2 text-sm mb-4"
                style={{ borderColor: "var(--cal-border)", background: "var(--cal-bg-alt)", color: "var(--cal-text)" }}
              />
              <div className="flex justify-end gap-2">
                <button onClick={() => { setCancelId(null); setCancelReason(""); }} className="btn-secondary">
                  Keep Meeting
                </button>
                <button onClick={cancelMeeting} className="rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ background: "#e11d48" }}>
                  Confirm Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Meeting modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="rounded-xl p-6 shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ background: "var(--cal-bg)" }}>
              <h3 className="text-lg font-bold mb-4" style={{ color: "var(--cal-heading)" }}>Add Meeting</h3>

              {addError && (
                <p className="text-sm mb-3 rounded-lg px-3 py-2" style={{ background: "#fee2e2", color: "#b91c1c" }}>{addError}</p>
              )}

              {/* Booking calendar */}
              {calendars.length > 0 && (
                <label className="block mb-3">
                  <span className="text-xs font-medium mb-1 block" style={{ color: "var(--cal-text)" }}>Booking Calendar</span>
                  <select
                    value={addForm.calendarId}
                    onChange={(e) => handleCalendarChange(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                    style={{ borderColor: "var(--cal-border)", background: "var(--cal-bg-alt)", color: "var(--cal-text)" }}
                  >
                    {calendars.map((c) => (
                      <option key={c.id} value={c.id}>{c.title} ({c.durationMinutes} min)</option>
                    ))}
                  </select>
                </label>
              )}

              {/* Guest info */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <label className="block">
                  <span className="text-xs font-medium mb-1 block" style={{ color: "var(--cal-text)" }}>First Name *</span>
                  <input
                    type="text"
                    value={addForm.firstName}
                    onChange={(e) => setAddForm((p) => ({ ...p, firstName: e.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                    style={{ borderColor: "var(--cal-border)", background: "var(--cal-bg-alt)", color: "var(--cal-text)" }}
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium mb-1 block" style={{ color: "var(--cal-text)" }}>Last Name *</span>
                  <input
                    type="text"
                    value={addForm.lastName}
                    onChange={(e) => setAddForm((p) => ({ ...p, lastName: e.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                    style={{ borderColor: "var(--cal-border)", background: "var(--cal-bg-alt)", color: "var(--cal-text)" }}
                  />
                </label>
              </div>

              <label className="block mb-3">
                <span className="text-xs font-medium mb-1 block" style={{ color: "var(--cal-text)" }}>Email *</span>
                <input
                  type="email"
                  value={addForm.email}
                  onChange={(e) => setAddForm((p) => ({ ...p, email: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  style={{ borderColor: "var(--cal-border)", background: "var(--cal-bg-alt)", color: "var(--cal-text)" }}
                />
              </label>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <label className="block">
                  <span className="text-xs font-medium mb-1 block" style={{ color: "var(--cal-text)" }}>Date *</span>
                  <input
                    type="date"
                    value={addForm.date}
                    onChange={(e) => setAddForm((p) => ({ ...p, date: e.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                    style={{ borderColor: "var(--cal-border)", background: "var(--cal-bg-alt)", color: "var(--cal-text)" }}
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium mb-1 block" style={{ color: "var(--cal-text)" }}>Start Time *</span>
                  <input
                    type="time"
                    value={addForm.time}
                    onChange={(e) => setAddForm((p) => ({ ...p, time: e.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                    style={{ borderColor: "var(--cal-border)", background: "var(--cal-bg-alt)", color: "var(--cal-text)" }}
                  />
                </label>
              </div>

              {/* Duration preview */}
              {addForm.calendarId && (() => {
                const cal = calendars.find((c) => c.id === addForm.calendarId);
                return cal ? (
                  <p className="text-xs mb-3" style={{ color: "var(--cal-muted)" }}>
                    Duration: {cal.durationMinutes} min · Ends at{" "}
                    {(() => {
                      const s = new Date(`${addForm.date}T${addForm.time}:00`);
                      const e = new Date(s.getTime() + cal.durationMinutes * 60 * 1000);
                      return e.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                    })()}
                  </p>
                ) : null;
              })()}

              {/* Location */}
              <label className="block mb-3">
                <span className="text-xs font-medium mb-1 block" style={{ color: "var(--cal-text)" }}>Location</span>
                <select
                  value={addForm.location}
                  onChange={(e) => setAddForm((p) => ({ ...p, location: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  style={{ borderColor: "var(--cal-border)", background: "var(--cal-bg-alt)", color: "var(--cal-text)" }}
                >
                  <option value="virtual">Virtual (Zoom)</option>
                  <option value="phone">Phone Call</option>
                  <option value="in-person">In Person</option>
                  <option value="other">Other</option>
                </select>
              </label>

              {addForm.location !== "virtual" && (
                <label className="block mb-3">
                  <span className="text-xs font-medium mb-1 block" style={{ color: "var(--cal-text)" }}>Location Details</span>
                  <input
                    type="text"
                    value={addForm.locationDetails}
                    onChange={(e) => setAddForm((p) => ({ ...p, locationDetails: e.target.value }))}
                    placeholder={addForm.location === "phone" ? "Phone number" : addForm.location === "in-person" ? "Address" : "Details"}
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                    style={{ borderColor: "var(--cal-border)", background: "var(--cal-bg-alt)", color: "var(--cal-text)" }}
                  />
                </label>
              )}

              {/* Notes */}
              <label className="block mb-4">
                <span className="text-xs font-medium mb-1 block" style={{ color: "var(--cal-text)" }}>Notes</span>
                <textarea
                  value={addForm.notes}
                  onChange={(e) => setAddForm((p) => ({ ...p, notes: e.target.value }))}
                  rows={2}
                  placeholder="Optional meeting notes…"
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  style={{ borderColor: "var(--cal-border)", background: "var(--cal-bg-alt)", color: "var(--cal-text)" }}
                />
              </label>

              {/* Actions */}
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowAddModal(false)} className="btn-secondary" disabled={addSubmitting}>Cancel</button>
                <button
                  onClick={submitAddMeeting}
                  disabled={addSubmitting}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{ background: "var(--cal-primary)" }}
                >
                  {addSubmitting ? "Creating…" : "Create Meeting"}
                </button>
              </div>
            </div>
          </div>
        )}
    </>
  );
}
