import { useCallback, useEffect, useState, type ReactNode } from 'react';
import type { AuthService, AuthUser } from '../../data/auth';
import { LoginPage } from './LoginPage';
import { ResetPasswordPage } from './ResetPasswordPage';
import type { Session } from './SessionContext';

type GateState =
  | { kind: 'checking' }
  | { kind: 'signedOut' }
  | { kind: 'recovery' }
  | { kind: 'signedIn'; user: AuthUser };

const sameUser = (a: AuthUser, b: AuthUser) =>
  a.id === b.id && a.email === b.email && a.name === b.name && a.avatarUrl === b.avatarUrl;

/** Chỉ cho vào app khi đã đăng nhập; xử lý cả luồng đặt lại mật khẩu từ link trong email. */
export function AuthGate({ auth, children }: { auth: AuthService; children: (session: Session) => ReactNode }) {
  const [state, setState] = useState<GateState>({ kind: 'checking' });

  useEffect(() => {
    let alive = true;
    const off = auth.onChange((event, user) => {
      if (event === 'PASSWORD_RECOVERY') {
        setState({ kind: 'recovery' });
        return;
      }
      setState((prev) => {
        if (!user) return { kind: 'signedOut' };
        if (prev.kind === 'recovery') return prev; // chờ người dùng đặt mật khẩu mới xong
        if (prev.kind === 'signedIn' && sameUser(prev.user, user)) return prev; // làm mới token: giữ nguyên
        return { kind: 'signedIn', user };
      });
    });
    auth
      .getUser()
      .then((user) => {
        if (!alive) return;
        setState((prev) => (prev.kind === 'checking' ? (user ? { kind: 'signedIn', user } : { kind: 'signedOut' }) : prev));
      })
      .catch(() => {
        if (alive) setState((prev) => (prev.kind === 'checking' ? { kind: 'signedOut' } : prev));
      });
    return () => {
      alive = false;
      off();
    };
  }, [auth]);

  const signOut = useCallback(() => auth.signOut(), [auth]);

  const finishRecovery = useCallback(() => {
    void auth.getUser().then((user) => setState(user ? { kind: 'signedIn', user } : { kind: 'signedOut' }));
  }, [auth]);

  if (state.kind === 'checking') {
    return (
      <p role="status" className="flex min-h-dvh items-center justify-center gap-2 text-sm text-zinc-500">
        <span className="size-1.5 animate-breathe rounded-full bg-brand-500" aria-hidden="true" />
        Đang kiểm tra đăng nhập…
      </p>
    );
  }
  if (state.kind === 'signedOut') return <LoginPage auth={auth} />;
  if (state.kind === 'recovery') return <ResetPasswordPage auth={auth} onDone={finishRecovery} />;
  return <>{children({ user: state.user, signOut })}</>;
}
