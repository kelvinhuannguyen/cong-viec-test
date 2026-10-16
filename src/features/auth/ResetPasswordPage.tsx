import { LockSimpleIcon } from '@phosphor-icons/react';
import { useState, type FormEvent } from 'react';
import { btn } from '../../components/ui/styles';
import type { AuthService } from '../../data/auth';
import { authErrorMessage } from './authErrors';
import { AuthField, AuthShowcase, Notice } from './authUi';
import { MIN_PASSWORD_LENGTH } from './LoginPage';

/** Mở khi người dùng bấm link đặt lại mật khẩu trong email (sự kiện PASSWORD_RECOVERY). */
export function ResetPasswordPage({ auth, onDone }: { auth: AuthService; onDone: () => void }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Mật khẩu cần ít nhất ${MIN_PASSWORD_LENGTH} ký tự.`);
      return;
    }
    if (password !== confirm) {
      setError('Hai mật khẩu chưa khớp nhau.');
      return;
    }
    setError('');
    setBusy(true);
    try {
      await auth.updatePassword(password);
      onDone();
    } catch (err) {
      setError(authErrorMessage(err));
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-dvh bg-zinc-50 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] dark:bg-zinc-950">
      <AuthShowcase />
      <main className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <h1 className="text-3xl font-semibold tracking-tighter">Đặt mật khẩu mới</h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Chọn mật khẩu mới cho tài khoản của bạn.</p>
          <form onSubmit={handleSubmit} noValidate className="mt-8 flex flex-col gap-4">
            <AuthField
              label="Mật khẩu mới"
              icon={LockSimpleIcon}
              type="password"
              autoComplete="new-password"
              placeholder={`Ít nhất ${MIN_PASSWORD_LENGTH} ký tự`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <AuthField
              label="Nhập lại mật khẩu mới"
              icon={LockSimpleIcon}
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
            {error && <Notice tone="error">{error}</Notice>}
            <button type="submit" className={`${btn.primary} h-11 w-full rounded-xl text-[15px]`} disabled={busy}>
              {busy ? 'Đang lưu…' : 'Lưu mật khẩu mới'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
