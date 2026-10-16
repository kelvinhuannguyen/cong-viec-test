import { ArrowLeftIcon, CheckIcon, EnvelopeSimpleIcon, LockSimpleIcon } from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'motion/react';
import { useState, type FormEvent } from 'react';
import { btn, spring } from '../../components/ui/styles';
import type { AuthService } from '../../data/auth';
import { authErrorMessage } from './authErrors';
import { AuthField, AuthShowcase, GoogleLogo, Notice } from './authUi';

type View = 'signIn' | 'signUp' | 'forgot';

export const MIN_PASSWORD_LENGTH = 8;

const TITLES: Record<View, { title: string; subtitle: string }> = {
  signIn: { title: 'Chào mừng trở lại', subtitle: 'Đăng nhập để xem công việc của bạn.' },
  signUp: { title: 'Tạo tài khoản', subtitle: 'Miễn phí. Dữ liệu được đồng bộ trên mọi thiết bị.' },
  forgot: { title: 'Quên mật khẩu', subtitle: 'Nhập email, chúng tôi sẽ gửi link để đặt mật khẩu mới.' },
};

export function LoginPage({ auth }: { auth: AuthService }) {
  const [view, setView] = useState<View>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState<'form' | 'google' | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  function go(next: View) {
    setView(next);
    setError('');
    setNotice('');
    setPassword('');
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      setError('Nhập email của bạn.');
      return;
    }
    if (view !== 'forgot' && !password) {
      setError('Nhập mật khẩu.');
      return;
    }
    if (view === 'signUp' && password.length < MIN_PASSWORD_LENGTH) {
      setError(`Mật khẩu cần ít nhất ${MIN_PASSWORD_LENGTH} ký tự.`);
      return;
    }
    setError('');
    setNotice('');
    setBusy('form');
    try {
      if (view === 'signIn') {
        await auth.signIn(trimmed, password);
      } else if (view === 'signUp') {
        const { needsConfirmation } = await auth.signUp(trimmed, password);
        if (needsConfirmation) {
          go('signIn');
          setNotice(`Đã gửi email xác nhận tới ${trimmed}. Bấm link trong email rồi quay lại đăng nhập.`);
        }
      } else {
        await auth.sendPasswordReset(trimmed);
        setNotice('Nếu email này có tài khoản, link đặt lại mật khẩu đã được gửi. Kiểm tra cả hộp thư rác.');
      }
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  async function handleGoogle() {
    setError('');
    setBusy('google');
    try {
      await auth.signInWithGoogle(); // trình duyệt chuyển sang Google
    } catch (err) {
      setError(authErrorMessage(err));
      setBusy(null);
    }
  }

  const { title, subtitle } = TITLES[view];
  const submitLabel = view === 'signIn' ? 'Đăng nhập' : view === 'signUp' ? 'Tạo tài khoản' : 'Gửi link đặt lại';

  return (
    <div className="grid min-h-dvh bg-zinc-50 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] dark:bg-zinc-950">
      <AuthShowcase />

      <main className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="flex size-8 items-center justify-center rounded-[10px] bg-zinc-900 dark:bg-zinc-100">
              <CheckIcon weight="bold" className="size-4 text-brand-400 dark:text-brand-700" aria-hidden="true" />
            </span>
            <span className="text-[15px] font-semibold tracking-tight">Công Việc Của Tôi</span>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={spring}
            >
              {view === 'forgot' && (
                <button
                  type="button"
                  onClick={() => go('signIn')}
                  className="mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                  <ArrowLeftIcon className="size-4" aria-hidden="true" />
                  Quay lại đăng nhập
                </button>
              )}
              <h1 className="text-3xl font-semibold tracking-tighter">{title}</h1>
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{subtitle}</p>

              {view !== 'forgot' && (
                <div
                  role="tablist"
                  aria-label="Chọn đăng nhập hoặc tạo tài khoản"
                  className="mt-8 grid grid-cols-2 rounded-xl border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  {(['signIn', 'signUp'] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      role="tab"
                      aria-selected={view === v}
                      onClick={() => go(v)}
                      className={`relative h-8 rounded-lg text-sm font-medium transition-colors ${
                        view === v ? 'text-zinc-900 dark:text-zinc-50' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
                      }`}
                    >
                      {view === v && (
                        <motion.span layoutId="auth-tab" transition={spring} className="absolute inset-0 rounded-lg bg-zinc-100 dark:bg-zinc-800" />
                      )}
                      <span className="relative">{v === 'signIn' ? 'Đăng nhập' : 'Tạo tài khoản'}</span>
                    </button>
                  ))}
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-4">
                <AuthField
                  label="Email"
                  icon={EnvelopeSimpleIcon}
                  type="email"
                  autoComplete="email"
                  placeholder="ban@vidu.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                {view !== 'forgot' && (
                  <div className="flex flex-col gap-2">
                    <AuthField
                      label="Mật khẩu"
                      icon={LockSimpleIcon}
                      type="password"
                      autoComplete={view === 'signIn' ? 'current-password' : 'new-password'}
                      placeholder={view === 'signUp' ? `Ít nhất ${MIN_PASSWORD_LENGTH} ký tự` : ''}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    {view === 'signIn' && (
                      <button
                        type="button"
                        onClick={() => go('forgot')}
                        className="self-end text-xs font-medium text-zinc-500 transition-colors hover:text-brand-700 dark:hover:text-brand-300"
                      >
                        Quên mật khẩu?
                      </button>
                    )}
                  </div>
                )}

                {error && <Notice tone="error">{error}</Notice>}
                {notice && <Notice tone="success">{notice}</Notice>}

                <button type="submit" className={`${btn.primary} h-11 w-full rounded-xl text-[15px]`} disabled={busy !== null}>
                  {busy === 'form' ? 'Đang xử lý…' : submitLabel}
                </button>
              </form>

              {view !== 'forgot' && (
                <>
                  <div className="my-6 flex items-center gap-3 text-xs text-zinc-400">
                    <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
                    hoặc
                    <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
                  </div>
                  <button
                    type="button"
                    onClick={handleGoogle}
                    disabled={busy !== null}
                    className={`${btn.secondary} h-11 w-full gap-2.5 rounded-xl text-[15px]`}
                  >
                    <GoogleLogo />
                    {busy === 'google' ? 'Đang chuyển tới Google…' : 'Tiếp tục với Google'}
                  </button>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
