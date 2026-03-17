-- ScheduleMuseAI Database Schema
-- Cloudflare D1 Database

-- Users table (managed by Clerk, but we may store additional user preferences)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, -- Clerk user ID
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  timezone TEXT DEFAULT 'UTC',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Staff members (service providers)
CREATE TABLE IF NOT EXISTS staff (
  id TEXT PRIMARY KEY,
  clerk_user_id TEXT, -- If staff are also users
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  bio TEXT,
  specialties TEXT, -- JSON array of services
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Services offered
CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL,
  price_cents INTEGER,
  category TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Staff availability slots
CREATE TABLE IF NOT EXISTS availability (
  id TEXT PRIMARY KEY,
  staff_id TEXT NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (staff_id) REFERENCES staff(id),
  UNIQUE(staff_id, date, start_time, end_time)
);

-- Appointments/Bookings
CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  staff_id TEXT NOT NULL,
  service_id TEXT,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  status TEXT DEFAULT 'confirmed', -- confirmed, cancelled, completed, no_show
  notes TEXT,
  price_cents INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (staff_id) REFERENCES staff(id),
  FOREIGN KEY (service_id) REFERENCES services(id)
);

-- AI conversation history (stored in KV, but we can have metadata here)
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  appointment_id TEXT,
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_message_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'active', -- active, completed, abandoned
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (appointment_id) REFERENCES appointments(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_staff_id ON appointments(staff_id);
CREATE INDEX IF NOT EXISTS idx_appointments_start_time ON appointments(start_time);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_availability_staff_date ON availability(staff_id, date);
CREATE INDEX IF NOT EXISTS idx_availability_available ON availability(is_available);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);

-- Sample data for development
INSERT OR IGNORE INTO staff (id, name, email, phone, bio, specialties) VALUES
('staff_1', 'Dr. Sarah Johnson', 'sarah@schedulemuse.ai', '+1-555-0101', 'Experienced therapist specializing in music performance anxiety', '["therapy", "counseling", "performance_anxiety"]'),
('staff_2', 'Mike Chen', 'mike@schedulemuse.ai', '+1-555-0102', 'Professional music producer and mixing engineer', '["production", "mixing", "recording"]'),
('staff_3', 'Elena Rodriguez', 'elena@schedulemuse.ai', '+1-555-0103', 'Voice coach and vocal technique specialist', '["voice_coaching", "vocal_technique", "singing"]');

INSERT OR IGNORE INTO services (id, name, description, duration_minutes, price_cents, category) VALUES
('service_1', 'Therapy Session', 'One-on-one therapy session for musicians', 60, 15000, 'therapy'),
('service_2', 'Mixing Session', 'Professional mixing and mastering consultation', 90, 20000, 'production'),
('service_3', 'Voice Lesson', 'Private voice coaching session', 45, 12000, 'coaching');

-- Sample availability (next 30 days for staff_1)
INSERT OR IGNORE INTO availability (id, staff_id, date, start_time, end_time, is_available)
SELECT
  'avail_' || staff_id || '_' || date || '_' || start_time,
  staff_id,
  date,
  start_time,
  end_time,
  TRUE
FROM (
  SELECT
    'staff_1' as staff_id,
    date,
    time as start_time,
    time(time, '+60 minutes') as end_time
  FROM (
    SELECT date, time
    FROM (
      SELECT DATE('now', '+' || (t1.n + t2.n*10 + t3.n*100) || ' days') as date
      FROM (SELECT 0 as n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) t1,
           (SELECT 0 as n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) t2,
           (SELECT 0 as n UNION SELECT 1 UNION SELECT 2) t3
      WHERE t1.n + t2.n*10 + t3.n*100 < 30
    ),
    (SELECT '09:00' as time UNION SELECT '10:00' UNION SELECT '11:00' UNION SELECT '13:00' UNION SELECT '14:00' UNION SELECT '15:00' UNION SELECT '16:00') times
    WHERE strftime('%w', date) NOT IN ('0', '6') -- Exclude weekends
  )
);