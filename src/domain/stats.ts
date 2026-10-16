import { addDays, addWeeks, format, startOfDay, startOfWeek, subDays, subWeeks } from 'date-fns';
import { isDueSoon, isOverdue } from './rules';
import type { Task, TaskStatus } from './task';

export interface ReportSummary {
  total: number;
  byStatus: Record<TaskStatus, number>;
  completionRate: number;
}

export interface CompletionBucket {
  key: string;
  label: string;
  count: number;
}

const WEEK_OPTIONS = { weekStartsOn: 1 } as const;

export function summarize(tasks: Task[]): ReportSummary {
  const byStatus: Record<TaskStatus, number> = { todo: 0, in_progress: 0, done: 0, on_hold: 0 };
  for (const t of tasks) byStatus[t.status] += 1;
  const total = tasks.length;
  return {
    total,
    byStatus,
    completionRate: total === 0 ? 0 : Math.round((byStatus.done / total) * 100),
  };
}

function bucketize(tasks: Task[], starts: Date[], keyOf: (d: Date) => string): CompletionBucket[] {
  const buckets = starts.map((d) => ({ key: keyOf(d), label: format(d, 'dd/MM'), count: 0 }));
  const index = new Map(buckets.map((b) => [b.key, b]));
  for (const t of tasks) {
    if (!t.completedAt) continue;
    const bucket = index.get(keyOf(new Date(t.completedAt)));
    if (bucket) bucket.count += 1;
  }
  return buckets;
}

export function completionsByDay(tasks: Task[], now: Date, days = 7): CompletionBucket[] {
  const first = startOfDay(subDays(now, days - 1));
  const starts = Array.from({ length: days }, (_, i) => addDays(first, i));
  return bucketize(tasks, starts, (d) => format(d, 'yyyy-MM-dd'));
}

export function completionsByWeek(tasks: Task[], now: Date, weeks = 8): CompletionBucket[] {
  const first = startOfWeek(subWeeks(now, weeks - 1), WEEK_OPTIONS);
  const starts = Array.from({ length: weeks }, (_, i) => addWeeks(first, i));
  return bucketize(tasks, starts, (d) => format(startOfWeek(d, WEEK_OPTIONS), 'yyyy-MM-dd'));
}

const byDueAsc = (a: Task, b: Task) => Date.parse(a.dueAt!) - Date.parse(b.dueAt!);

export function overdueTasks(tasks: Task[], now: Date): Task[] {
  return tasks.filter((t) => isOverdue(t, now)).sort(byDueAsc);
}

export function dueSoonTasks(tasks: Task[], now: Date): Task[] {
  return tasks.filter((t) => isDueSoon(t, now)).sort(byDueAsc);
}
