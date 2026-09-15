import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  rawUrl &&
  rawUrl.trim() !== '' &&
  rawUrl !== 'http://127.0.0.1:54321' &&
  rawKey &&
  rawKey.trim() !== '' &&
  rawKey !== 'dummy'
);

const supabaseUrl = rawUrl || 'http://127.0.0.1:54321';
const supabaseAnonKey = rawKey || 'dummy';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

