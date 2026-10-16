import { isOverdue } from './rules';
import type { Task } from './task';

export const REMINDER_LEAD_MS = 60 * 60 * 1000;
export const OVERDUE_NOTIFY_WINDOW_MS = 24 * 60 * 60 * 1000;

export type ReminderKind = 'due_soon' | 'overdue';

export interface Reminder {
  key: string;
  kind: ReminderKind;
  task: Task;
}

export interface DailySummary {
  dueToday: number;
  overdue: number;
}

export function reminderKey(task: Pick<Task, 'id' | 'dueAt'>, kind: ReminderKind): string {
  return `${task.id}:${task.dueAt}:${kind}`;
}

export function dueReminders(tasks: Task[], now: Date, sent: ReadonlySet<string>): Reminder[] {
  const result: Reminder[] = [];
  for (const task of tasks) {
    if (task.status === 'done' || task.dueAt === null) continue;
    const diff = Date.parse(task.dueAt) - now.getTime();
    let kind: ReminderKind | null = null;
    if (diff >= 0 && diff <= REMINDER_LEAD_MS) kind = 'due_soon';
    else if (diff < 0 && -diff <= OVERDUE_NOTIFY_WINDOW_MS) kind = 'overdue';
    if (!kind) continue;
    const key = reminderKey(task, kind);
    if (!sent.has(key)) result.push({ key, kind, task });
  }
  return result;
}

function sameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  );
}

export function dailySummary(tasks: Task[], now: Date): DailySummary | null {
  let dueToday = 0;
  let overdue = 0;
  for (const task of tasks) {
    if (task.status === 'done' || task.dueAt === null) continue;
    if (isOverdue(task, now)) overdue += 1;
    else if (sameLocalDay(new Date(task.dueAt), now)) dueToday += 1;
  }
  return dueToday === 0 && overdue === 0 ? null : { dueToday, overdue };
}

export function pruneSentKeys(keys: string[], tasks: Task[]): string[] {
  const prefixes = new Set(
    tasks.filter((t) => t.status !== 'done' && t.dueAt !== null).map((t) => `${t.id}:${t.dueAt}:`),
  );
  return keys.filter((key) => {
    const prefix = key.slice(0, key.lastIndexOf(':') + 1);
    return prefixes.has(prefix);
  });
}
