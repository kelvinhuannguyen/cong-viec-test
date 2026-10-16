import { SignOutIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import { btn } from '../../components/ui/styles';
import { useSession } from './SessionContext';

function initials(name: string | null, email: string | null): string {
  const source = (name ?? email ?? '?').trim();
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '?') + (name ? (parts[1]?.[0] ?? '') : '')).toUpperCase();
}

export function Avatar({ name, email, url }: { name: string | null; email: string | null; url: string | null }) {
  const [broken, setBroken] = useState(false);
  if (url && !broken) {
    return (
      <img
        src={url}
        alt=""
        referrerPolicy="no-referrer"
        onError={() => setBroken(true)}
        className="size-8 shrink-0 rounded-full object-cover ring-1 ring-zinc-200 dark:ring-zinc-700"
      />
    );
  }
  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-800 dark:bg-brand-500/15 dark:text-brand-200">
      {initials(name, email)}
    </span>
  );
}

/** Người đang đăng nhập và nút Đăng xuất (thanh bên). Không hiện ở chế độ lưu trên máy. */
export function UserMenu() {
  const session = useSession();
  if (!session) return null;
  const { user, signOut } = session;
  return (
    <div className="flex items-center gap-2.5 rounded-2xl px-2 py-1.5">
      <Avatar name={user.name} email={user.email} url={user.avatarUrl} />
      <div className="min-w-0 flex-1">
        {user.name && <p className="truncate text-sm font-medium">{user.name}</p>}
        <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{user.email}</p>
      </div>
      <button type="button" className={btn.icon} aria-label="Đăng xuất" title="Đăng xuất" onClick={() => void signOut()}>
        <SignOutIcon className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
