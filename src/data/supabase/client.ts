import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

/**
 * Một client duy nhất cho cả app (giữ phiên đăng nhập trong localStorage, tự làm mới token).
 * Luồng 'implicit' (mặc định cho app chỉ chạy trên trình duyệt): link xác nhận / đặt lại mật khẩu
 * trong email mở được trên bất kỳ thiết bị nào. PKCE thì chỉ mở được trên đúng trình duyệt đã yêu cầu.
 */
export function getSupabaseClient(url: string, publishableKey: string): SupabaseClient {
  client ??= createClient(url, publishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'implicit',
    },
  });
  return client;
}
