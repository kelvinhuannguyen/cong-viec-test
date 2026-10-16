import { TASK_STATUSES, type Priority, type Task, type TaskStatus } from './task';

export type StatusFilter = TaskStatus | 'all';
export const SORT_KEYS = ['due', 'priority', 'created'] as const;
export type SortKey = (typeof SORT_KEYS)[number];

const PRIORITY_RANK: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .trim();
}

export function searchTasks(tasks: Task[], query: string): Task[] {
  const q = normalizeText(query);
  if (!q) return tasks;
  return tasks.filter((t) => normalizeText(t.title).includes(q));
}

export function filterByStatus(tasks: Task[], status: StatusFilter): Task[] {
  return status === 'all' ? tasks : tasks.filter((t) => t.status === status);
}

export function countByStatus(tasks: Task[]): Record<StatusFilter, number> {
  const counts: Record<StatusFilter, number> = {
    all: tasks.length,
    todo: 0,
    in_progress: 0,
    done: 0,
    on_hold: 0,
  };
  for (const t of tasks) counts[t.status] += 1;
  return counts;
}

function compareDue(a: Task, b: Task): number {
  if (a.dueAt === b.dueAt) return 0;
  if (a.dueAt === null) return 1;
  if (b.dueAt === null) return -1;
  return Date.parse(a.dueAt) - Date.parse(b.dueAt);
}

function compareCreatedDesc(a: Task, b: Task): number {
  return Date.parse(b.createdAt) - Date.parse(a.createdAt);
}

export function sortTasks(tasks: Task[], key: SortKey): Task[] {
  const copy = [...tasks];
  if (key === 'due') return copy.sort((a, b) => compareDue(a, b) || compareCreatedDesc(a, b));
  if (key === 'priority') {
    return copy.sort(
      (a, b) =>
        PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
        compareDue(a, b) ||
        compareCreatedDesc(a, b),
    );
  }
  return copy.sort(compareCreatedDesc);
}

export function parseStatusFilter(value: string | null): StatusFilter {
  return value !== null && (TASK_STATUSES as readonly string[]).includes(value)
    ? (value as TaskStatus)
    : 'all';
}

export function parseSortKey(value: string | null): SortKey {
  return value !== null && (SORT_KEYS as readonly string[]).includes(value)
    ? (value as SortKey)
    : 'due';
}
