import type { Priority, TaskStatus } from '../domain/task';

/** Chấm màu trạng thái dùng chung cho danh sách, Kanban, bộ lọc và báo cáo. */
export const STATUS_DOT: Record<TaskStatus, string> = {
  todo: 'bg-zinc-400 dark:bg-zinc-500',
  in_progress: 'bg-brand-300',
  on_hold: 'bg-amber-500',
  done: 'bg-brand-600 dark:bg-brand-500',
};

/** Màu cố định cho biểu đồ (SVG không đọc được class Tailwind); khớp với STATUS_DOT. */
export const STATUS_HEX: Record<TaskStatus, string> = {
  todo: '#a1a1aa',
  in_progress: '#86d8bb',
  on_hold: '#f59e0b',
  done: '#26a47c',
};

export const PRIORITY_TONE: Record<Priority, string> = {
  high: 'text-rose-600 dark:text-rose-400',
  medium: 'text-amber-600 dark:text-amber-400',
  low: 'text-zinc-400 dark:text-zinc-500',
};
