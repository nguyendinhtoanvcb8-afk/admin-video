import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { loadConfig } from './config.js';

let client = null;

export async function getSupabase() {
  if (client) return client;
  const { SUPABASE_URL, SUPABASE_ANON_KEY } = await loadConfig();
  client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false } // không dùng Supabase Auth
  });
  return client;
}
