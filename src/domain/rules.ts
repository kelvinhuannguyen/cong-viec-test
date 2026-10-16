import type { Task, TaskStatus } from './task';

export const DUE_SOON_MS = 3 * 24 * 60 * 60 * 1000;
export const TITLE_MAX = 200;
export const LABEL_NAME_MAX = 30;

export function applyStatusChange(
  task: Pick<Task, 'status' | 'completedAt'>,
  next: TaskStatus,
  now: Date,
): Pick<Task, 'status' | 'completedAt'> {
  if (next !== 'done') return { status: next, completedAt: null };
  if (task.status === 'done') return { status: next, completedAt: task.completedAt };
  return { status: next, completedAt: now.toISOString() };
}

type DueFields = Pick<Task, 'status' | 'dueAt'>;

export function isOverdue(task: DueFields, now: Date): boolean {
  if (task.status === 'done' || task.dueAt === null) return false;
  return Date.parse(task.dueAt) < now.getTime();
}

export function isDueSoon(task: DueFields, now: Date): boolean {
  if (task.status === 'done' || task.dueAt === null) return false;
  const due = Date.parse(task.dueAt);
  return due >= now.getTime() && due <= now.getTime() + DUE_SOON_MS;
}

function normalizeText(value: string, max: number): string | null {
  const trimmed = value.normalize('NFC').trim();
  return trimmed.length >= 1 && trimmed.length <= max ? trimmed : null;
}

export function normalizeTitle(title: string): string | null {
  return normalizeText(title, TITLE_MAX);
}

export function normalizeLabelName(name: string): string | null {
  return normalizeText(name, LABEL_NAME_MAX);
}

export function sameLabelName(a: string, b: string): boolean {
  return a.normalize('NFC').trim().toLocaleLowerCase('vi') === b.normalize('NFC').trim().toLocaleLowerCase('vi');
}

const pad = (n: number) => String(n).padStart(2, '0');

/** `date` dạng yyyy-MM-dd, `time` dạng HH:mm hoặc rỗng (→ 23:59). */
export function toDueAt(date: string, time: string): string | null {
  if (!date) return null;
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = time ? time.split(':').map(Number) : [23, 59];
  return new Date(y, m - 1, d, hh, mm, 0, 0).toISOString();
}

export function fromDueAt(dueAt: string | null): { date: string; time: string } {
  if (!dueAt) return { date: '', time: '' };
  const d = new Date(dueAt);
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const isEndOfDay = d.getHours() === 23 && d.getMinutes() === 59;
  return { date, time: isEndOfDay ? '' : `${pad(d.getHours())}:${pad(d.getMinutes())}` };
}
