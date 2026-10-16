import { vi } from 'vitest';
import type { AuthEvent, AuthService, AuthUser } from '../data/auth';

/** Dịch vụ đăng nhập giả để test giao diện; `emit` mô phỏng sự kiện từ Supabase. */
export function createFakeAuth(initialUser: AuthUser | null = null) {
  const listeners = new Set<(event: AuthEvent, user: AuthUser | null) => void>();
  let user = initialUser;
  const emit = (event: AuthEvent, next: AuthUser | null) => {
    user = next;
    for (const l of listeners) l(event, next);
  };
  const auth: AuthService = {
    getUser: vi.fn(async () => user),
    onChange: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    signIn: vi.fn(async () => {}),
    signUp: vi.fn(async () => ({ needsConfirmation: true })),
    signInWithGoogle: vi.fn(async () => {}),
    sendPasswordReset: vi.fn(async () => {}),
    updatePassword: vi.fn(async () => {}),
    signOut: vi.fn(async () => emit('SIGNED_OUT', null)),
  };
  return { auth, emit };
}

export const testUser: AuthUser = { id: 'u-1', email: 'lan.tran@vidu.com', name: 'Trần Ngọc Lan', avatarUrl: null };
