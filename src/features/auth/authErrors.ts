import { AuthError } from '../../data/auth';

const MESSAGES: Record<string, string> = {
  invalid_credentials: 'Email hoặc mật khẩu không đúng.',
  email_not_confirmed: 'Email chưa được xác nhận. Hãy bấm link trong email chúng tôi đã gửi.',
  user_already_exists: 'Email này đã có tài khoản. Hãy đăng nhập.',
  email_exists: 'Email này đã có tài khoản. Hãy đăng nhập.',
  weak_password: 'Mật khẩu quá yếu. Dùng ít nhất 8 ký tự, có cả chữ và số.',
  same_password: 'Mật khẩu mới phải khác mật khẩu cũ.',
  email_address_invalid: 'Email không hợp lệ.',
  validation_failed: 'Email hoặc mật khẩu không hợp lệ.',
  over_email_send_rate_limit: 'Bạn vừa yêu cầu quá nhiều email. Thử lại sau ít phút.',
  over_request_rate_limit: 'Bạn thử quá nhiều lần. Đợi một lát rồi thử lại.',
  signup_disabled: 'Hiện chưa cho tạo tài khoản mới.',
  provider_disabled: 'Đăng nhập bằng Google chưa được bật cho ứng dụng này.',
  network: 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.',
  otp_expired: 'Link trong email đã hết hạn hoặc đã được dùng. Hãy yêu cầu link mới.',
  access_denied: 'Đăng nhập đã bị huỷ hoặc link không còn hợp lệ.',
};

/**
 * Lỗi Supabase gửi kèm khi quay lại app từ link email / Google (#error_code=... hoặc ?error_code=...).
 * Trả về thông điệp tiếng Việt và xoá các tham số đó khỏi thanh địa chỉ.
 */
export function consumeUrlAuthError(): string | null {
  const url = new URL(window.location.href);
  const hash = new URLSearchParams(url.hash.startsWith('#') ? url.hash.slice(1) : url.hash);
  const code = hash.get('error_code') ?? url.searchParams.get('error_code') ?? hash.get('error') ?? url.searchParams.get('error');
  if (!code) return null;
  for (const key of ['error', 'error_code', 'error_description']) url.searchParams.delete(key);
  window.history.replaceState(null, '', url.pathname + url.search);
  return MESSAGES[code] ?? AUTH_FALLBACK;
}

export const AUTH_FALLBACK = 'Đã có lỗi khi đăng nhập. Thử lại sau.';

export function authErrorMessage(error: unknown): string {
  if (error instanceof AuthError) return MESSAGES[error.code] ?? AUTH_FALLBACK;
  return AUTH_FALLBACK;
}
