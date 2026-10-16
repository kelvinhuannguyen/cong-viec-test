/** Người dùng đã đăng nhập (độc lập với thư viện Supabase để giao diện test được bằng bản giả). */
export interface AuthUser {
  id: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
}

export type AuthEvent = 'SIGNED_IN' | 'SIGNED_OUT' | 'PASSWORD_RECOVERY' | 'OTHER';

export interface AuthService {
  /** Phiên hiện có (đọc từ bộ nhớ trình duyệt), hoặc null. */
  getUser(): Promise<AuthUser | null>;
  /** Theo dõi thay đổi phiên; trả về hàm huỷ theo dõi. */
  onChange(listener: (event: AuthEvent, user: AuthUser | null) => void): () => void;
  signIn(email: string, password: string): Promise<void>;
  /** needsConfirmation = true khi phải bấm link trong email trước khi đăng nhập được. */
  signUp(email: string, password: string): Promise<{ needsConfirmation: boolean }>;
  /** Chuyển trang sang Google; quay lại app khi xong. */
  signInWithGoogle(): Promise<void>;
  sendPasswordReset(email: string): Promise<void>;
  updatePassword(password: string): Promise<void>;
  signOut(): Promise<void>;
}

/** Lỗi đăng nhập có mã ổn định (theo mã lỗi của Supabase Auth) để dịch sang tiếng Việt. */
export class AuthError extends Error {
  readonly code: string;

  constructor(code: string, message?: string) {
    super(message ?? code);
    this.name = 'AuthError';
    this.code = code;
  }
}
