import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

/** Một client duy nhất cho cả app (giữ phiên đăng nhập trong localStorage, tự làm mới token). */
export function getSupabaseClient(url: string, publishableKey: string): SupabaseClient {
  client ??= createClient(url, publishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
  });
  return client;
}
