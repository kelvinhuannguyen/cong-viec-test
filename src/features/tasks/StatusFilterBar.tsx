import { motion } from 'motion/react';
import { spring } from '../../components/ui/styles';
import type { StatusFilter } from '../../domain/query';
import { STATUS_LABELS, TASK_STATUSES } from '../../domain/task';
import { STATUS_DOT } from '../../lib/statusStyles';

const OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  ...TASK_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] })),
];

export function StatusFilterBar({
  value,
  counts,
  onChange,
}: {
  value: StatusFilter;
  counts: Record<StatusFilter, number>;
  onChange: (value: StatusFilter) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Lọc theo trạng thái"
      className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:mx-0 md:flex-wrap md:px-0"
    >
      {OPTIONS.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={`relative flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors duration-200 active:scale-[0.97] ${
              active ? 'text-zinc-50 dark:text-zinc-900' : 'text-zinc-600 hover:bg-zinc-200/60 dark:text-zinc-400 dark:hover:bg-zinc-800/80'
            }`}
          >
            {active && (
              <motion.span
                layoutId="status-filter-pill"
                transition={spring}
                className="absolute inset-0 rounded-full bg-zinc-900 dark:bg-zinc-100"
              />
            )}
            {option.value !== 'all' && (
              <span className={`relative size-1.5 rounded-full ${STATUS_DOT[option.value]}`} aria-hidden="true" />
            )}
            <span className="relative">{option.label}</span>{' '}
            <span
              className={`relative font-mono text-xs tabular-nums ${active ? 'text-zinc-400 dark:text-zinc-500' : 'text-zinc-400 dark:text-zinc-500'}`}
            >
              {counts[option.value]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
