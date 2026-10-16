import { CheckIcon, EyeIcon, EyeSlashIcon, type Icon } from '@phosphor-icons/react';
import { useId, useState, type InputHTMLAttributes, type ReactNode } from 'react';
import { field, fieldLabel } from '../../components/ui/styles';

/** Ô nhập của màn hình đăng nhập: nhãn ở trên, icon bên trái, nút hiện/ẩn với mật khẩu. */
export function AuthField({
  label,
  icon: FieldIcon,
  type = 'text',
  ...rest
}: { label: string; icon: Icon } & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  const [reveal, setReveal] = useState(false);
  const isPassword = type === 'password';
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className={fieldLabel}>
        {label}
      </label>
      <div className="relative flex items-center">
        <FieldIcon className="pointer-events-none absolute left-3 size-4 text-zinc-400" aria-hidden="true" />
        <input
          id={id}
          type={isPassword && reveal ? 'text' : type}
          className={`${field} h-11 w-full rounded-xl pl-9 ${isPassword ? 'pr-11' : ''}`}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setReveal((r) => !r)}
            aria-label={reveal ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            className="absolute right-1.5 flex size-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            {reveal ? <EyeSlashIcon className="size-4" aria-hidden="true" /> : <EyeIcon className="size-4" aria-hidden="true" />}
          </button>
        )}
      </div>
    </div>
  );
}

export function GoogleLogo() {
  return (
    <svg viewBox="0 0 48 48" className="size-[18px]" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

export function Notice({ tone, children }: { tone: 'error' | 'success'; children: ReactNode }) {
  return (
    <p
      role={tone === 'error' ? 'alert' : 'status'}
      className={`rounded-xl border px-3.5 py-2.5 text-sm ${
        tone === 'error'
          ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300'
          : 'border-brand-200 bg-brand-50 text-brand-800 dark:border-brand-500/20 dark:bg-brand-500/10 dark:text-brand-200'
      }`}
    >
      {children}
    </p>
  );
}

/** Nửa trái của màn hình đăng nhập (ẩn trên điện thoại): thương hiệu và lợi ích chính. */
export function AuthShowcase() {
  const points = ['Danh sách, Kanban và báo cáo ở một nơi', 'Dữ liệu đồng bộ trên mọi thiết bị', 'Nhắc hạn chót để không lỡ việc'];
  const preview = [
    { title: 'Nộp báo cáo thuế quý 3', done: true },
    { title: 'Họp nhóm thiết kế lúc 15:00', done: false },
    { title: 'Đặt vé xe về quê', done: false },
  ];
  return (
    <div className="relative hidden overflow-hidden bg-zinc-950 p-12 text-zinc-100 lg:flex lg:flex-col lg:justify-between">
      <div className="pointer-events-none absolute -right-32 -top-32 size-[28rem] rounded-full bg-brand-500/10 blur-3xl" aria-hidden="true" />
      <div className="relative flex items-center gap-2.5">
        <span className="flex size-9 items-center justify-center rounded-[11px] bg-zinc-100">
          <CheckIcon weight="bold" className="size-4 text-brand-700" aria-hidden="true" />
        </span>
        <span className="text-base font-semibold tracking-tight">Công Việc Của Tôi</span>
      </div>

      <div className="relative max-w-md">
        <h2 className="text-4xl font-semibold leading-[1.1] tracking-tighter">Gọn gàng mọi việc, ở mọi thiết bị.</h2>
        <ul className="mt-8 space-y-3">
          {points.map((p) => (
            <li key={p} className="flex items-center gap-3 text-sm text-zinc-400">
              <span className="flex size-5 items-center justify-center rounded-full bg-brand-500/15">
                <CheckIcon weight="bold" className="size-3 text-brand-400" aria-hidden="true" />
              </span>
              {p}
            </li>
          ))}
        </ul>
      </div>

      <div
        className="relative w-full max-w-sm divide-y divide-white/5 rounded-2xl border border-white/10 bg-white/[0.03] shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]"
        aria-hidden="true"
      >
        {preview.map((item) => (
          <div key={item.title} className="flex items-center gap-3 px-4 py-3 text-sm">
            <span
              className={`flex size-4 items-center justify-center rounded-[5px] border ${
                item.done ? 'border-brand-500 bg-brand-500' : 'border-zinc-600'
              }`}
            >
              {item.done && <CheckIcon weight="bold" className="size-2.5 text-zinc-950" />}
            </span>
            <span className={item.done ? 'text-zinc-500 line-through' : 'text-zinc-200'}>{item.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
