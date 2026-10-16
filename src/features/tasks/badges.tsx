import { isDueSoon, isOverdue } from '../../domain/rules';
import { PRIORITY_LABELS, type Label, type Priority, type Task } from '../../domain/task';
import { formatDateTime, formatDueLabel } from '../../lib/format';
import { LABEL_COLOR_CLASSES } from '../../lib/labelColors';

const PRIORITY_CLASSES: Record<Priority, string> = {
  high: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  low: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return <span className={`rounded-full px-2 py-0.5 ${PRIORITY_CLASSES[priority]}`}>{PRIORITY_LABELS[priority]}</span>;
}

export function DueBadge({ task, now }: { task: Task; now: Date }) {
  if (!task.dueAt) return null;
  const tone = isOverdue(task, now)
    ? 'font-semibold text-red-600 dark:text-red-400'
    : isDueSoon(task, now)
      ? 'text-orange-600 dark:text-orange-400'
      : 'text-slate-500';
  return (
    <span className={tone} title={formatDateTime(task.dueAt)}>
      ⏰ {formatDueLabel(task.dueAt, now)}
    </span>
  );
}

export function LabelChips({ labelIds, labelsById }: { labelIds: string[]; labelsById: Map<string, Label> }) {
  const labels = labelIds.map((id) => labelsById.get(id)).filter((l): l is Label => l !== undefined);
  return (
    <>
      {labels.map((label) => (
        <span key={label.id} className={`rounded-full px-2 py-0.5 ${LABEL_COLOR_CLASSES[label.color]}`}>
          #{label.name}
        </span>
      ))}
    </>
  );
}
