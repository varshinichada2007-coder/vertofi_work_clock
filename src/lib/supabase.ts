/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const dummyUrl = 'https://placeholder.supabase.co';
const dummyKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder';

const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

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
  return isValidUrl(envUrl) && typeof envKey === 'string' && envKey.trim().length > 0 && !envUrl?.includes('placeholder');
};

const supabaseUrl = isValidUrl(envUrl) ? envUrl! : dummyUrl;
const supabasePublishableKey = envKey && envKey.trim().length > 0 ? envKey : dummyKey;

if (!isSupabaseConfigured()) {
  console.warn('Supabase environment variables are missing or unconfigured. Using local storage fallback mode.');
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey);
