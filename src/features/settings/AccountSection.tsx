import { SignOutIcon } from '@phosphor-icons/react';
import { btn } from '../../components/ui/styles';
import type { Session } from '../auth/SessionContext';
import { Avatar } from '../auth/UserMenu';

export function AccountSection({ session }: { session: Session }) {
  const { user, signOut } = session;
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
      <Avatar name={user.name} email={user.email} url={user.avatarUrl} />
      <div className="min-w-0 flex-1">
        {user.name && <p className="truncate text-sm font-medium">{user.name}</p>}
        <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">{user.email}</p>
      </div>
      <button type="button" className={btn.secondary} onClick={() => void signOut()}>
        <SignOutIcon className="size-4" aria-hidden="true" />
        Đăng xuất
      </button>
    </div>
  );
}
