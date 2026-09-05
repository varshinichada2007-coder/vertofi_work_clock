-- ========================================================
-- VERTOFI WORKCLOCK - COMPLETE SUPABASE DATABASE SCHEMA
-- ========================================================

-- 1. Create Profiles Table (Stores Employees and Admins)
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  employee_id TEXT UNIQUE NOT NULL,
  department TEXT NOT NULL DEFAULT 'Engineering',
  designation TEXT NOT NULL DEFAULT 'Software Engineer',
  role TEXT NOT NULL CHECK (role IN ('ADMIN', 'EMPLOYEE')) DEFAULT 'EMPLOYEE',
  employee_type TEXT NOT NULL CHECK (employee_type IN ('Employee', 'Intern')) DEFAULT 'Employee',
  joining_date DATE NOT NULL DEFAULT CURRENT_DATE,
  profile_image TEXT,
  work_location TEXT DEFAULT 'Work From Home',
  phone TEXT DEFAULT '+91 98765 43210',
  manager_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create Attendance Records Table
CREATE TABLE IF NOT EXISTS public.attendance_records (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
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

-- 3. Create Break Records Table
CREATE TABLE IF NOT EXISTS public.break_records (
  id TEXT PRIMARY KEY,
  attendance_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  break_type TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  duration_seconds INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Create Work Sessions Table
CREATE TABLE IF NOT EXISTS public.work_sessions (
  id TEXT PRIMARY KEY,
  attendance_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  duration_seconds INTEGER DEFAULT 0,
  activity TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Working',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Create Activity Records Table
CREATE TABLE IF NOT EXISTS public.activity_records (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  attendance_id TEXT NOT NULL,
  activity TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  duration_seconds INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Working',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Create User Settings Table
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id TEXT PRIMARY KEY,
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

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.break_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Create Open RLS Policies for Cloud Access across all devices
DROP POLICY IF EXISTS "Profiles open access" ON public.profiles;
CREATE POLICY "Profiles open access" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Attendance open access" ON public.attendance_records;
CREATE POLICY "Attendance open access" ON public.attendance_records FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Breaks open access" ON public.break_records;
CREATE POLICY "Breaks open access" ON public.break_records FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Sessions open access" ON public.work_sessions;
CREATE POLICY "Sessions open access" ON public.work_sessions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Activities open access" ON public.activity_records;
CREATE POLICY "Activities open access" ON public.activity_records FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Settings open access" ON public.user_settings;
CREATE POLICY "Settings open access" ON public.user_settings FOR ALL USING (true) WITH CHECK (true);

-- Automatic Profile Creation Trigger when a User Signs Up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  is_first BOOLEAN;
  assigned_role TEXT;
BEGIN
  SELECT COUNT(*) = 0 INTO is_first FROM public.profiles;
  IF is_first THEN
    assigned_role := 'ADMIN';
  ELSE
    assigned_role := COALESCE(new.raw_user_meta_data->>'role', 'EMPLOYEE');
  END IF;

  INSERT INTO public.profiles (
    id, name, email, employee_id, role, employee_type, department, designation
  ) VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    COALESCE(new.raw_user_meta_data->>'employee_id', 'EMP' || LPAD((SELECT COUNT(*)+1 FROM public.profiles)::TEXT, 3, '0')),
    assigned_role,
    COALESCE(new.raw_user_meta_data->>'employee_type', 'Employee'),
    COALESCE(new.raw_user_meta_data->>'department', 'Engineering'),
    COALESCE(new.raw_user_meta_data->>'designation', 'Software Engineer')
  ) ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if any, then recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
