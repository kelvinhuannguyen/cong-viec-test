import { createContext, useContext } from 'react';
import type { AuthUser } from '../../data/auth';

export interface Session {
  user: AuthUser;
  signOut(): Promise<void>;
}

const SessionContext = createContext<Session | null>(null);

export const SessionProvider = SessionContext.Provider;

/** Phiên đăng nhập hiện tại; null ở chế độ lưu trên máy (không đăng nhập). */
export function useSession(): Session | null {
  return useContext(SessionContext);
}
