import type { StatusFilter } from '../../domain/query';
import { STATUS_LABELS, TASK_STATUSES } from '../../domain/task';

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
    <div role="group" aria-label="Lọc theo trạng thái" className="flex flex-wrap gap-2">
      {OPTIONS.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={`rounded-full border px-3 py-1 text-sm ${
              active
                ? 'border-blue-600 bg-blue-600 text-white'
                : 'border-slate-300 bg-white hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800'
            }`}
          >
            {option.label} {counts[option.value]}
          </button>
        );
      })}
    </div>
  );
}
