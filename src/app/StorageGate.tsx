import { useEffect, useState, type ReactNode } from 'react';
import { createDefaultRepositories } from '../data';
import { probeIndexedDb } from '../data/probe';
import type { Repositories } from '../data/repository';

type GateState = { kind: 'checking' } | { kind: 'ready'; repositories: Repositories } | { kind: 'unavailable' };

export function StorageGate({
  children,
  probe = probeIndexedDb,
  createRepositories = createDefaultRepositories,
}: {
  children: (repositories: Repositories) => ReactNode;
  probe?: () => Promise<boolean>;
  createRepositories?: () => Repositories;
}) {
  const [state, setState] = useState<GateState>({ kind: 'checking' });

  useEffect(() => {
    let cancelled = false;
    void probe().then((ok) => {
      if (cancelled) return;
      setState(ok ? { kind: 'ready', repositories: createRepositories() } : { kind: 'unavailable' });
    });
    return () => {
      cancelled = true;
    };
  }, [probe, createRepositories]);

  if (state.kind === 'checking') {
    return (
      <p role="status" className="flex min-h-dvh items-center justify-center gap-2 text-sm text-zinc-500">
        <span className="size-1.5 animate-breathe rounded-full bg-brand-500" aria-hidden="true" />
        Đang mở dữ liệu…
      </p>
    );
  }
  if (state.kind === 'unavailable') {
    return (
      <div role="alert" className="mx-auto mt-24 max-w-md space-y-3 px-6">
        <h1 className="text-2xl font-semibold tracking-tight">Không thể lưu dữ liệu</h1>
        <p className="leading-relaxed text-zinc-600 dark:text-zinc-300">
          Trình duyệt này đang chặn bộ nhớ IndexedDB, thường do chế độ ẩn danh hoặc cài đặt quyền riêng tư.
          Hãy mở ứng dụng trong cửa sổ thường hoặc một trình duyệt khác.
        </p>
      </div>
    );
  }
  return <>{children(state.repositories)}</>;
}
