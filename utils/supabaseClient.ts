import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wqklukruzxicjaeblser.supabase.co';
let supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Fallback to active publishable key if legacy key (starts with eyJ) or missing
if (!supabaseAnonKey || supabaseAnonKey.startsWith('eyJ')) {
  supabaseAnonKey = 'sb_publishable_lSFRnJu5fvLwzGC4ltpw0w_TN0XnmCu';
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  }
});
