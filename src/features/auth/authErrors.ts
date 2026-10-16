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
};

export const AUTH_FALLBACK = 'Đã có lỗi khi đăng nhập. Thử lại sau.';

export function authErrorMessage(error: unknown): string {
  if (error instanceof AuthError) return MESSAGES[error.code] ?? AUTH_FALLBACK;
  return AUTH_FALLBACK;
}
