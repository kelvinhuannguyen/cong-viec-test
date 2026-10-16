import { QuestionIcon, ShieldCheckIcon, ShieldWarningIcon } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';

export function StorageStatus() {
  const [persisted, setPersisted] = useState<boolean | null>(null);

  useEffect(() => {
    let alive = true;
    navigator.storage
      ?.persisted?.()
      .then((value) => {
        if (alive) setPersisted(value);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  const text =
    persisted === null ? 'Không rõ' : persisted ? 'Có' : 'Chưa — trình duyệt có thể xoá dữ liệu khi máy thiếu dung lượng';
  const StatusIcon = persisted === null ? QuestionIcon : persisted ? ShieldCheckIcon : ShieldWarningIcon;
  const tone =
    persisted === null
      ? 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
      : persisted
        ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300'
        : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300';

  return (
    <p className="flex items-start gap-3 text-sm">
      <span className={`flex size-8 shrink-0 items-center justify-center rounded-xl ${tone}`}>
        <StatusIcon weight="duotone" className="size-[18px]" aria-hidden="true" />
      </span>
      <span className="pt-1.5 text-zinc-600 dark:text-zinc-300">Dữ liệu được bảo vệ khỏi việc tự xoá: {text}</span>
    </p>
  );
}
