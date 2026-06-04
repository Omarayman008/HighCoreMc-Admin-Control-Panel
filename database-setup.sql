-- 1. EMPLOYEES TABLE
CREATE TABLE IF NOT EXISTS employees (
  id BIGINT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'إداري',
  avatar TEXT DEFAULT '⭐',
  color TEXT DEFAULT '#F4B942',
  points INTEGER DEFAULT 0,
  dc_points INTEGER DEFAULT 0,
  mc_points INTEGER DEFAULT 0,
  tickets INTEGER DEFAULT 0,
  discord_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. TICKETS TABLE
CREATE TABLE IF NOT EXISTS tickets (
  id SERIAL PRIMARY KEY,
  ticket_id TEXT UNIQUE,
  title TEXT,
  emp_id BIGINT,
  status TEXT DEFAULT 'open',
  pts INTEGER DEFAULT 0,
  response_time TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. ACTIVITY LOG TABLE
CREATE TABLE IF NOT EXISTS activity_log (
  id SERIAL PRIMARY KEY,
  action_type TEXT,
  details TEXT,
  category TEXT,
  user_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- MINECRAFT SECTION TABLES
-- =============================================

-- 14. MC REPORTS TABLE
CREATE TABLE IF NOT EXISTS mc_reports (
  id SERIAL PRIMARY KEY,
  emp_id BIGINT REFERENCES employees(id),
  type TEXT NOT NULL, -- 'monitoring', 'glitch', 'special'
  title TEXT,
  description TEXT,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  handled_violations INTEGER DEFAULT 0,
  general_violations INTEGER DEFAULT 0,
  evidence_url TEXT,
  points_awarded INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  review_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. MC TASKS TABLE
CREATE TABLE IF NOT EXISTS mc_tasks (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  points INTEGER DEFAULT 0,
  days_limit INTEGER DEFAULT 3,
  created_by TEXT,
  status TEXT DEFAULT 'active', -- 'active', 'completed'
  completed_by BIGINT REFERENCES employees(id),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. MC EVENTS TABLE
CREATE TABLE IF NOT EXISTS mc_events (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL, -- 'text', 'stage'
  description TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  points INTEGER DEFAULT 0,
  max_supervisors INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. MC EVENT PARTICIPANTS TABLE
CREATE TABLE IF NOT EXISTS mc_event_participants (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES mc_events(id) ON DELETE CASCADE,
  emp_id BIGINT REFERENCES employees(id),
  status TEXT DEFAULT 'reserved', -- 'reserved', 'submitted', 'approved', 'rejected'
  role_description TEXT,
  performance_rating TEXT,
  evidence_url TEXT,
  attendance_type TEXT, -- 'voice', 'text', 'both'
  points_awarded INTEGER DEFAULT 0,
  review_note TEXT,
  reserved_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ
);


-- =============================================
-- ADD MISSING COLUMNS (if tables already exist)
-- =============================================

-- Employees columns
ALTER TABLE employees ADD COLUMN IF NOT EXISTS dc_points INTEGER DEFAULT 0;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS mc_points INTEGER DEFAULT 0;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS discord_id TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS job_titles JSONB DEFAULT '[]'::jsonb;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS rank_override TEXT;

-- MC Reports columns
ALTER TABLE mc_reports ADD COLUMN IF NOT EXISTS images_url TEXT;
ALTER TABLE mc_reports ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE mc_reports ADD COLUMN IF NOT EXISTS reviewed BOOLEAN DEFAULT FALSE;
ALTER TABLE mc_reports ADD COLUMN IF NOT EXISTS reviewed_by TEXT;
ALTER TABLE mc_reports ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
ALTER TABLE mc_reports ADD COLUMN IF NOT EXISTS review_note TEXT;
ALTER TABLE mc_reports ADD COLUMN IF NOT EXISTS rejected BOOLEAN DEFAULT FALSE;

-- History columns
ALTER TABLE history ADD COLUMN IF NOT EXISTS dot_type TEXT DEFAULT 'green';
ALTER TABLE history ADD COLUMN IF NOT EXISTS time_label TEXT DEFAULT 'الآن';

-- =============================================
-- ENABLE ROW LEVEL SECURITY (Optional but recommended)
-- =============================================

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE history ENABLE ROW LEVEL SECURITY;
ALTER TABLE completed_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE mc_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE whitelist ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE ranks ENABLE ROW LEVEL SECURITY;
ALTER TABLE criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- =============================================
-- CREATE POLICIES (Allow all for anon - adjust as needed)
-- =============================================

-- Employees policies
DROP POLICY IF EXISTS "Allow all for employees" ON employees;
CREATE POLICY "Allow all for employees" ON employees FOR ALL USING (true) WITH CHECK (true);

-- History policies
DROP POLICY IF EXISTS "Allow all for history" ON history;
CREATE POLICY "Allow all for history" ON history FOR ALL USING (true) WITH CHECK (true);

-- Completed tasks policies
DROP POLICY IF EXISTS "Allow all for completed_tasks" ON completed_tasks;
CREATE POLICY "Allow all for completed_tasks" ON completed_tasks FOR ALL USING (true) WITH CHECK (true);

-- Tasks policies
DROP POLICY IF EXISTS "Allow all for tasks" ON tasks;
CREATE POLICY "Allow all for tasks" ON tasks FOR ALL USING (true) WITH CHECK (true);

-- MC Reports policies
DROP POLICY IF EXISTS "Allow all for mc_reports" ON mc_reports;
CREATE POLICY "Allow all for mc_reports" ON mc_reports FOR ALL USING (true) WITH CHECK (true);

-- Events policies
DROP POLICY IF EXISTS "Allow all for events" ON events;
CREATE POLICY "Allow all for events" ON events FOR ALL USING (true) WITH CHECK (true);

-- Whitelist policies
DROP POLICY IF EXISTS "Allow all for whitelist" ON whitelist;
CREATE POLICY "Allow all for whitelist" ON whitelist FOR ALL USING (true) WITH CHECK (true);

-- Teams policies
DROP POLICY IF EXISTS "Allow all for teams" ON teams;
CREATE POLICY "Allow all for teams" ON teams FOR ALL USING (true) WITH CHECK (true);

-- Ranks policies
DROP POLICY IF EXISTS "Allow all for ranks" ON ranks;
CREATE POLICY "Allow all for ranks" ON ranks FOR ALL USING (true) WITH CHECK (true);

-- Criteria policies
DROP POLICY IF EXISTS "Allow all for criteria" ON criteria;
CREATE POLICY "Allow all for criteria" ON criteria FOR ALL USING (true) WITH CHECK (true);

-- Settings policies
DROP POLICY IF EXISTS "Allow all for settings" ON settings;
CREATE POLICY "Allow all for settings" ON settings FOR ALL USING (true) WITH CHECK (true);

-- Tickets policies
DROP POLICY IF EXISTS "Allow all for tickets" ON tickets;
CREATE POLICY "Allow all for tickets" ON tickets FOR ALL USING (true) WITH CHECK (true);

-- Activity log policies
DROP POLICY IF EXISTS "Allow all for activity_log" ON activity_log;
CREATE POLICY "Allow all for activity_log" ON activity_log FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- INSERT DEFAULT RANKS (if empty)
-- =============================================

INSERT INTO ranks (name, emoji, min_pts, max_pts, color, sort_order)
SELECT * FROM (VALUES
  ('مبتدئ', '🌱', 0, 49, '#888888', 1),
  ('نشيط', '⭐', 50, 99, '#F4B942', 2),
  ('متميز', '🌟', 100, 199, '#FFD700', 3),
  ('محترف', '💎', 200, 349, '#00D4FF', 4),
  ('خبير', '👑', 350, 499, '#9B59B6', 5),
  ('أسطوري', '🏆', 500, 999999, '#FF6B6B', 6)
) AS v(name, emoji, min_pts, max_pts, color, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM ranks LIMIT 1);

-- =============================================
-- DONE! ✅
-- =============================================

SELECT 'Database setup completed successfully! ✅' as status;
