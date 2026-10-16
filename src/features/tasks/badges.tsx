import { CalendarBlankIcon, FlagIcon, WarningCircleIcon } from '@phosphor-icons/react';
import { isDueSoon, isOverdue } from '../../domain/rules';
import { PRIORITY_LABELS, type Label, type Priority, type Task } from '../../domain/task';
import { formatDateTime, formatDueLabel } from '../../lib/format';
import { LABEL_DOT_CLASSES } from '../../lib/labelColors';
import { PRIORITY_TONE } from '../../lib/statusStyles';

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span className={`inline-flex items-center gap-1 ${PRIORITY_TONE[priority]}`}>
      <FlagIcon weight={priority === 'low' ? 'regular' : 'fill'} className="size-3.5" aria-hidden="true" />
      <span className="text-zinc-500 dark:text-zinc-400">{PRIORITY_LABELS[priority]}</span>
    </span>
  );
}

export function DueBadge({ task, now }: { task: Task; now: Date }) {
  if (!task.dueAt) return null;
  const overdue = isOverdue(task, now);
  const soon = !overdue && isDueSoon(task, now);
  const tone = overdue
    ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-200/70 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/20'
    : soon
      ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/70 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20'
      : 'text-zinc-500 dark:text-zinc-400';
  const DueIcon = overdue ? WarningCircleIcon : CalendarBlankIcon;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md ${overdue || soon ? 'px-1.5 py-0.5 font-medium' : ''} ${tone}`}
      title={formatDateTime(task.dueAt)}
    >
      <DueIcon className="size-3.5" aria-hidden="true" />
      {formatDueLabel(task.dueAt, now)}
    </span>
  );
}

export function LabelChips({ labelIds, labelsById }: { labelIds: string[]; labelsById: Map<string, Label> }) {
  const labels = labelIds.map((id) => labelsById.get(id)).filter((l): l is Label => l !== undefined);
  return (
    <>
      {labels.map((label) => (
        <span
          key={label.id}
          className="inline-flex items-center gap-1.5 rounded-md bg-zinc-100 px-1.5 py-0.5 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
        >
          <span className={`size-1.5 rounded-full ${LABEL_DOT_CLASSES[label.color]}`} aria-hidden="true" />
          {label.name}
        </span>
      ))}
    </>
  );
}
