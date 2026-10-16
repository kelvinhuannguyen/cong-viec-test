import { CloudArrowUpIcon } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { Dialog } from '../../components/ui/Dialog';
import { useToast } from '../../components/ui/Toast';
import { btn } from '../../components/ui/styles';
import { readLocalSnapshot } from '../../data';
import { reassignIds } from '../../domain/importMerge';
import type { Label, Task } from '../../domain/task';
import { useImportData } from '../../hooks/useImportData';
import { SAVE_ERROR } from '../../lib/errors';
import { newId } from '../../lib/id';
import { usePref } from '../../lib/prefs';

type Snapshot = { tasks: Task[]; labels: Label[] };

export const localImportKey = (userId: string) => `cvct.localImport.${userId}`;

/**
 * Lần đầu đăng nhập trên một máy còn dữ liệu của chế độ lưu trên máy: hỏi một lần để đưa lên tài khoản.
 * "Bỏ qua" thì không hỏi lại; đóng hộp thoại (Esc) thì lần sau mở app sẽ hỏi lại.
 */
export function LocalImportPrompt({
  userId,
  readLocal = readLocalSnapshot,
}: {
  userId: string;
  readLocal?: () => Promise<Snapshot>;
}) {
  const [flag, setFlag] = usePref<string | null>(localImportKey(userId), null);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const importData = useImportData();
  const toast = useToast();

  useEffect(() => {
    if (flag) return;
    let alive = true;
    readLocal()
      .then((data) => {
        if (alive && (data.tasks.length > 0 || data.labels.length > 0)) setSnapshot(data);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [flag, readLocal]);

  if (flag || dismissed || !snapshot) return null;

  async function upload(data: Snapshot) {
    try {
      await importData.mutateAsync(reassignIds(data, newId));
      setFlag('done');
      toast.show({ message: `Đã đưa ${data.tasks.length} việc lên tài khoản` });
    } catch {
      toast.show({ message: SAVE_ERROR });
    }
  }

  return (
    <Dialog title="Đưa dữ liệu lên tài khoản" onClose={() => setDismissed(true)}>
      <div className="flex gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
          <CloudArrowUpIcon weight="duotone" className="size-6" aria-hidden="true" />
        </span>
        <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
          Tìm thấy <strong className="font-semibold text-zinc-900 dark:text-zinc-100">{snapshot.tasks.length} việc</strong> và{' '}
          <strong className="font-semibold text-zinc-900 dark:text-zinc-100">{snapshot.labels.length} nhãn</strong> được lưu trên máy
          này trước khi bạn đăng nhập. Đưa lên tài khoản để xem được trên mọi thiết bị? Dữ liệu trên máy vẫn được giữ nguyên.
        </p>
      </div>
      <div className="-mx-6 -mb-6 mt-6 flex justify-end gap-2 border-t border-zinc-100 bg-zinc-50/60 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900/60">
        <button type="button" className={btn.secondary} onClick={() => setFlag('skipped')}>
          Bỏ qua
        </button>
        <button type="button" className={btn.primary} disabled={importData.isPending} onClick={() => void upload(snapshot)}>
          {importData.isPending ? 'Đang đưa lên…' : 'Đưa lên'}
        </button>
      </div>
    </Dialog>
  );
}
