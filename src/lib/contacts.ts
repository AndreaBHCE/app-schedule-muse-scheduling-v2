/**
 * Shared contact types and formatting helpers.
 *
 * Used by:
 *  - /api/contacts (list, create, patch, delete)
 *  - /api/contacts/[id] (get, put, delete)
 */

/* ── DB row type ─────────────────────────────────────────── */

export interface ContactRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  name: string | null; // legacy — computed from first_name + last_name
  email: string;
  phone: string;
  company: string;
  tags: string;
  notes: string;
  total_meetings: number;
  last_meeting_at: string;
  created_at: string;
  updated_at: string;
}

/* ── API payload type ────────────────────────────────────── */

export interface ContactPayload {
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  tags?: string[];
  notes?: string;
}

/* ── Helpers ──────────────────────────────────────────────── */

/**
 * Convert a DB row into a camelCase API response object.
 * Uses first_name + last_name as the canonical name source.
 * Falls back to the legacy `name` column if both are empty (pre-migration rows).
 */
export function formatContact(row: ContactRow) {
  const firstName = (row.first_name || "").trim();
  const lastName = (row.last_name || "").trim();
  const fullNameFromSplit = [firstName, lastName].filter(Boolean).join(" ");
  const fallbackName = (row.name || "").trim();
  const fullName = fullNameFromSplit || fallbackName;

  return {
    id: row.id,
    firstName,
    lastName,
    name: fullName,
    email: row.email,
    phone: row.phone,
    company: row.company,
    tags: JSON.parse(row.tags || "[]"),
    notes: row.notes,
    totalMeetings: row.total_meetings,
    lastMeetingAt: row.last_meeting_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Split a full name string into first / last name parts.
 * "John Smith" → { firstName: "John", lastName: "Smith" }
 * "John van der Berg" → { firstName: "John", lastName: "van der Berg" }
 */
export function splitName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/);
  if (parts.length <= 1) {
    return { firstName: parts[0] || "", lastName: "" };
  }
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}
