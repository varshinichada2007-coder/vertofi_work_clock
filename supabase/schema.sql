-- ========================================================
-- VERTOFI WORKCLOCK - COMPLETE SUPABASE DATABASE SCHEMA
-- ========================================================

-- 1. Organizations Table
CREATE TABLE IF NOT EXISTS public.organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  standard_hours NUMERIC(4, 2) DEFAULT 8.0,
  max_break_minutes INTEGER DEFAULT 60,
  timezone TEXT DEFAULT 'Asia/Kolkata',
  currency TEXT DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Profiles Table (Admins & Employees)
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL DEFAULT 'org_vertofi',
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT DEFAULT 'password123',
  employee_id TEXT UNIQUE NOT NULL,
  department TEXT NOT NULL DEFAULT 'Engineering',
  designation TEXT NOT NULL DEFAULT 'Software Engineer',
  role TEXT NOT NULL CHECK (role IN ('ADMIN', 'EMPLOYEE')) DEFAULT 'EMPLOYEE',
  employee_type TEXT NOT NULL CHECK (employee_type IN ('Employee', 'Intern')) DEFAULT 'Employee',
  joining_date DATE NOT NULL DEFAULT CURRENT_DATE,
  profile_image TEXT,
  work_location TEXT DEFAULT 'Work From Home',
  phone TEXT DEFAULT '+91 98765 43210',
  manager_name TEXT DEFAULT 'Goutham Badiga (Admin)',
  status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'DEACTIVATED')) DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Attendance Records Table
CREATE TABLE IF NOT EXISTS public.attendance_records (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL DEFAULT 'org_vertofi',
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_name TEXT,
  user_email TEXT,
  employee_id TEXT,
  department TEXT,
  designation TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  day_name TEXT NOT NULL,
  clock_in TEXT NOT NULL,
  clock_in_timestamp BIGINT NOT NULL,
  clock_out TEXT,
  clock_out_timestamp BIGINT,
  total_break_seconds INTEGER DEFAULT 0,
  total_work_seconds INTEGER DEFAULT 0,
  net_work_seconds INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Present',
  completion_status TEXT DEFAULT 'Working',
  is_late BOOLEAN DEFAULT FALSE,
  late_minutes INTEGER DEFAULT 0,
  initial_task TEXT,
  current_activity TEXT,
  end_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Break Records Table
CREATE TABLE IF NOT EXISTS public.break_records (
  id TEXT PRIMARY KEY,
  attendance_id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  break_type TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  duration_seconds INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Assigned Tasks Table
CREATE TABLE IF NOT EXISTS public.assigned_tasks (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL DEFAULT 'org_vertofi',
  assigned_to_user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_by_name TEXT NOT NULL DEFAULT 'Goutham Badiga (Admin)',
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')) DEFAULT 'MEDIUM',
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED')) DEFAULT 'PENDING',
  due_date DATE NOT NULL,
  estimated_hours NUMERIC(4, 1) DEFAULT 4.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Leave Requests Table
CREATE TABLE IF NOT EXISTS public.leave_requests (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL DEFAULT 'org_vertofi',
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  employee_id TEXT NOT NULL,
  department TEXT NOT NULL,
  leave_type TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_count NUMERIC(4, 1) NOT NULL DEFAULT 1.0,
  reason TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Pending', 'Approved', 'Rejected')) DEFAULT 'Pending',
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Attendance Correction Requests Table
CREATE TABLE IF NOT EXISTS public.attendance_corrections (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL DEFAULT 'org_vertofi',
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  employee_id TEXT NOT NULL,
  attendance_id TEXT,
  target_date DATE NOT NULL,
  requested_clock_in TEXT,
  requested_clock_out TEXT,
  reason TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Pending', 'Approved', 'Rejected')) DEFAULT 'Pending',
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL DEFAULT 'org_vertofi',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  action TEXT NOT NULL,
  target_user_id TEXT,
  target_user_name TEXT,
  target_employee_id TEXT,
  field_name TEXT,
  original_value TEXT,
  new_value TEXT,
  changed_by_user_id TEXT NOT NULL,
  changed_by_user_name TEXT NOT NULL,
  changed_by_role TEXT NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Work Schedules Table
CREATE TABLE IF NOT EXISTS public.work_schedules (
  organization_id TEXT PRIMARY KEY,
  schedules JSONB NOT NULL,
  grace_period_minutes INTEGER DEFAULT 15,
  auto_clock_out_hours NUMERIC(4, 2) DEFAULT 12.0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. User Settings Table
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id TEXT PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  clock_in_reminder BOOLEAN DEFAULT TRUE,
  clock_in_time TEXT DEFAULT '09:00',
  clock_out_reminder BOOLEAN DEFAULT TRUE,
  clock_out_time TEXT DEFAULT '18:00',
  break_duration_warning BOOLEAN DEFAULT TRUE,
  max_break_minutes INTEGER DEFAULT 60,
  activity_check_in BOOLEAN DEFAULT TRUE,
  activity_interval_minutes INTEGER DEFAULT 120,
  use_24_hour_clock BOOLEAN DEFAULT FALSE,
  timezone TEXT DEFAULT 'Asia/Kolkata',
  email_notifications BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS) with open access policies for app multi-device sync
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.break_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assigned_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_corrections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Organizations open access" ON public.organizations;
CREATE POLICY "Organizations open access" ON public.organizations FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Profiles open access" ON public.profiles;
CREATE POLICY "Profiles open access" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Attendance open access" ON public.attendance_records;
CREATE POLICY "Attendance open access" ON public.attendance_records FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Breaks open access" ON public.break_records;
CREATE POLICY "Breaks open access" ON public.break_records FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Tasks open access" ON public.assigned_tasks;
CREATE POLICY "Tasks open access" ON public.assigned_tasks FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Leaves open access" ON public.leave_requests;
CREATE POLICY "Leaves open access" ON public.leave_requests FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Corrections open access" ON public.attendance_corrections;
CREATE POLICY "Corrections open access" ON public.attendance_corrections FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Audit logs open access" ON public.audit_logs;
CREATE POLICY "Audit logs open access" ON public.audit_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Schedules open access" ON public.work_schedules;
CREATE POLICY "Schedules open access" ON public.work_schedules FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Settings open access" ON public.user_settings;
CREATE POLICY "Settings open access" ON public.user_settings FOR ALL USING (true) WITH CHECK (true);

-- ========================================================
-- SEED INITIAL DATA
-- ========================================================

-- Seed Default Organization
INSERT INTO public.organizations (id, name, code, standard_hours, max_break_minutes, timezone)
VALUES ('org_vertofi', 'Vertofi Technologies Pvt. Ltd.', 'VERTOFI-HQ', 8.0, 60, 'Asia/Kolkata')
ON CONFLICT (id) DO NOTHING;

-- Seed Admin Profile
INSERT INTO public.profiles (
  id, organization_id, name, email, password, employee_id, department, designation, role, employee_type, joining_date, phone, work_location, manager_name
) VALUES (
  'f45bd396-988c-4f4a-8c85-f203722a1d41',
  'org_vertofi',
  'Goutham Badiga',
  'gouthambadiga01@gmail.com',
  'Vertofi@Fintech12',
  'AD001',
  'Administration',
  'System Administrator',
  'ADMIN',
  'Employee',
  '2026-09-04',
  '+91 9666417876',
  'Headquarters',
  'Board of Directors'
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  password = EXCLUDED.password;

-- Seed Authentic Employee Profiles (5 Employee / Intern accounts)
INSERT INTO public.profiles (
  id, organization_id, name, email, password, employee_id, department, designation, role, employee_type, joining_date, phone, work_location, manager_name
) VALUES 
(
  '3f72f92d-f0c5-48ce-8e02-b0bc83ec3ba7',
  'org_vertofi',
  'Parvatham Geethika',
  'parvathamgeethika@gmail.com',
  'Geethika@123',
  'EMP001',
  'Engineering',
  'Frontend Intern',
  'EMPLOYEE',
  'Intern',
  '2026-09-04',
  '+91 9603556970',
  'Work From Home',
  'Goutham Badiga (Admin)'
),
(
  '22b17343-5a98-4791-a81a-bef302715d09',
  'org_vertofi',
  'Varshini Chada',
  'varshinichada2007@gmail.com',
  'Varshini@123',
  'EMP002',
  'Engineering',
  'Frontend Intern',
  'EMPLOYEE',
  'Intern',
  '2026-09-05',
  '+91 9652383330',
  'Work From Home',
  'Goutham Badiga (Admin)'
),
(
  'f0db1ceb-584e-4282-ae7b-2707bab456ab',
  'org_vertofi',
  'Dasari Pravallika',
  'dasaripravallika137@gmail.com',
  'Pravallika@123',
  'EMP003',
  'Engineering',
  'Technical Intern',
  'EMPLOYEE',
  'Intern',
  '2026-09-05',
  '+91 9701172908',
  'Work From Home',
  'Goutham Badiga (Admin)'
),
(
  'f9ee9b4b-a254-46d1-8ea6-5d191e5b7718',
  'org_vertofi',
  'Polamuri Lohith',
  'lohithpolamuri630@gmail.com',
  'Lohith@123',
  'EMP004',
  'Engineering',
  'Technical Intern ( full stack)',
  'EMPLOYEE',
  'Intern',
  '2026-09-05',
  '+91 6303154495',
  'Work From Home',
  'Goutham Badiga (Admin)'
),
(
  '1b97461f-5f16-4976-a6fc-4ade9bc396fc',
  'org_vertofi',
  'Mohammad Suhana',
  'mdsuhana231@gmail.com',
  'Suhana@123',
  'EMP005',
  'Engineering',
  'AI&ML engineer ( full stack )',
  'EMPLOYEE',
  'Intern',
  '2026-09-05',
  '+91 9059637295',
  'Work From Home',
  'Goutham Badiga (Admin)'
) ON CONFLICT (id) DO NOTHING;

-- Seed Sample Assigned Tasks
INSERT INTO public.assigned_tasks (
  id, organization_id, assigned_to_user_id, assigned_by_name, title, description, priority, status, due_date, estimated_hours
) VALUES
(
  'task_seed_1',
  'org_vertofi',
  '3f72f92d-f0c5-48ce-8e02-b0bc83ec3ba7',
  'Goutham Badiga',
  'Frontend Performance & Optimization',
  'Ensure clean responsiveness and real-time punch state synchronization across devices.',
  'HIGH',
  'IN_PROGRESS',
  CURRENT_DATE,
  6.0
),
(
  'task_seed_2',
  'org_vertofi',
  '22b17343-5a98-4791-a81a-bef302715d09',
  'Goutham Badiga',
  'Design System & Timesheets Wireframing',
  'Ensure clean SaaS white background styling and responsive mobile punch clock layouts.',
  'MEDIUM',
  'PENDING',
  CURRENT_DATE + INTERVAL '2 days',
  4.0
) ON CONFLICT (id) DO NOTHING;

-- Enable Supabase Realtime for Multi-Laptop Live Broadcasts
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance_records;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.break_records;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.assigned_tasks;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.leave_requests;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance_corrections;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;
