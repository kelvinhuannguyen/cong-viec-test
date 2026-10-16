import type { AuthChangeEvent, SupabaseClient, User } from '@supabase/supabase-js';
import { AuthError, type AuthEvent, type AuthService, type AuthUser } from '../auth';

function toAuthUser(user: User): AuthUser {
  const meta = user.user_metadata ?? {};
  return {
    id: user.id,
    email: user.email ?? null,
    name: (meta.full_name as string | undefined) ?? (meta.name as string | undefined) ?? null,
    avatarUrl: (meta.avatar_url as string | undefined) ?? (meta.picture as string | undefined) ?? null,
  };
}

function toEvent(event: AuthChangeEvent): AuthEvent {
  return event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'PASSWORD_RECOVERY' ? event : 'OTHER';
}

function fail(error: { code?: string; status?: number; message: string }): never {
  // Lỗi mạng của fetch không có code → 'network'.
  throw new AuthError(error.code ?? (error.status === 0 || error.status === undefined ? 'network' : 'unknown'), error.message);
}

/** Địa chỉ quay lại sau email xác nhận / đặt lại mật khẩu / Google: chính trang đang chạy app. */
const redirectTo = () => window.location.origin;

export function createSupabaseAuth(client: SupabaseClient): AuthService {
  return {
    async getUser() {
      const { data } = await client.auth.getSession();
      return data.session ? toAuthUser(data.session.user) : null;
    },

    onChange(listener) {
      // Không gọi hàm Supabase khác bên trong callback (tránh khoá chờ nhau trong supabase-js).
      const { data } = client.auth.onAuthStateChange((event, session) => {
        listener(toEvent(event), session ? toAuthUser(session.user) : null);
      });
      return () => data.subscription.unsubscribe();
    },

    async signIn(email, password) {
      const { error } = await client.auth.signInWithPassword({ email, password });
      if (error) fail(error);
    },

    async signUp(email, password) {
      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: redirectTo() },
      });
      if (error) fail(error);
      return { needsConfirmation: data.session === null };
    },

    async signInWithGoogle() {
      const { error } = await client.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: redirectTo() },
      });
      if (error) fail(error);
    },

    async sendPasswordReset(email) {
      const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo: redirectTo() });
      if (error) fail(error);
    },

    async updatePassword(password) {
      const { error } = await client.auth.updateUser({ password });
      if (error) fail(error);
    },

    async signOut() {
      const { error } = await client.auth.signOut();
      if (error) fail(error);
    },
  };
}
