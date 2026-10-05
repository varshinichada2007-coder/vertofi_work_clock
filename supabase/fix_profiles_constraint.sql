-- =========================================================================
-- RUN THIS IN SUPABASE SQL EDITOR TO UNLOCK DIRECT MEMBER CREATION
-- Supabase Dashboard URL: https://supabase.com/dashboard/project/xcnuadmazbbohdzwqvpg/sql
-- =========================================================================

-- 1. Drop the foreign key constraint that references auth.users:
-- This allows Admins to add interns & employees directly from any laptop without hitting Supabase email rate limits.
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- 2. Add password and status columns directly to profiles:
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status text DEFAULT 'ACTIVE';

-- 3. Enable Supabase Realtime broadcast for profiles and attendance:
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'attendance_records'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance_records;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'break_records'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.break_records;
  END IF;
END $$;
