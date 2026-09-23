/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://xcnuadmazbbohdzwqvpg.supabase.co';
const DEFAULT_SUPABASE_KEY = 'sb_publishable_jo-_edQmK0oglpMwu8V1-g_gSMGtJNU';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const rawKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_KEY;

const isValidUrl = (url?: string) => {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

export const isSupabaseConfigured = (): boolean => {
  return isValidUrl(rawUrl) && typeof rawKey === 'string' && rawKey.trim().length > 0 && !rawUrl.includes('placeholder');
};

export const supabase = createClient(rawUrl, rawKey);
