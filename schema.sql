-- ScheduleMuseAI — D1 Schema
-- Personal scheduling platform (user IS the provider)
-- Last updated: 2026-03-20

-- ────────────────────────────────────────────────
-- Users (synced from Clerk on first sign-in)
-- ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id              TEXT PRIMARY KEY,
  email           TEXT NOT NULL,
  display_name    TEXT NOT NULL DEFAULT '',
  avatar_url      TEXT DEFAULT '',
  timezone        TEXT NOT NULL DEFAULT 'America/New_York',
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ────────────────────────────────────────────────
-- Booking Pages (what the subscriber designs)
-- ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS booking_pages (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  slug            TEXT NOT NULL,
  description     TEXT DEFAULT '',
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  buffer_minutes  INTEGER NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('published','draft','paused')),
  color           TEXT DEFAULT '#0d9488',
  location_type   TEXT DEFAULT 'virtual' CHECK(location_type IN ('virtual','phone','in-person')),
  location_details TEXT DEFAULT '',
  config          TEXT DEFAULT '{}',
  bookings_last_7d INTEGER NOT NULL DEFAULT 0,
  conversion_delta_pct REAL NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_bp_user_slug ON booking_pages(user_id, slug);

-- ────────────────────────────────────────────────
-- Meetings (booked appointments)
-- ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS meetings (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  booking_page_id TEXT REFERENCES booking_pages(id) ON DELETE SET NULL,
  guest_name      TEXT NOT NULL,
  guest_email     TEXT NOT NULL,
  meeting_type    TEXT NOT NULL DEFAULT '',
  start_time      TEXT NOT NULL,
  end_time        TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'confirmed' CHECK(status IN ('confirmed','pending','canceled','completed','no-show')),
  location        TEXT DEFAULT 'virtual' CHECK(location IN ('virtual','phone','in-person')),
  location_details TEXT DEFAULT '',
  notes           TEXT DEFAULT '',
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_meetings_user_start ON meetings(user_id, start_time);
CREATE INDEX IF NOT EXISTS idx_meetings_guest_email ON meetings(guest_email);

-- ────────────────────────────────────────────────
-- Contacts (CRM-lite)
-- ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contacts (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  first_name      TEXT DEFAULT '',
  last_name       TEXT DEFAULT '',
  name            TEXT DEFAULT '',
  email           TEXT NOT NULL,
  phone           TEXT DEFAULT '',
  company         TEXT DEFAULT '',
  tags            TEXT DEFAULT '[]',
  notes           TEXT DEFAULT '',
  last_meeting_at TEXT,
  total_meetings  INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_contacts_user_email ON contacts(user_id, email);

-- ────────────────────────────────────────────────
-- Integrations
-- ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS integrations (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider        TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'disconnected' CHECK(status IN ('connected','disconnected','error')),
  access_token    TEXT DEFAULT '',
  refresh_token   TEXT DEFAULT '',
  metadata        TEXT DEFAULT '{}',
  connected_at    TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_integrations_user_provider ON integrations(user_id, provider);

-- ────────────────────────────────────────────────
-- Availability Schedules
-- ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS availability_schedules (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL DEFAULT 'Default',
  timezone        TEXT NOT NULL DEFAULT 'America/New_York',
  rules           TEXT NOT NULL DEFAULT '{}',
  is_default      INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ────────────────────────────────────────────────
-- API Keys (developer page)
-- ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS api_keys (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  key_hash        TEXT NOT NULL,
  key_prefix      TEXT NOT NULL,
  permissions     TEXT NOT NULL DEFAULT '["read"]',
  last_used_at    TEXT,
  expires_at      TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ────────────────────────────────────────────────
-- Webhooks (developer page)
-- ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS webhooks (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  url             TEXT NOT NULL,
  events          TEXT NOT NULL DEFAULT '["meeting.created"]',
  secret          TEXT NOT NULL,
  active          INTEGER NOT NULL DEFAULT 1,
  last_triggered_at TEXT,
  failure_count   INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
