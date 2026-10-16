import type { Task, TaskStatus, TaskUpdate } from './task';

/** Vị trí để đặt một việc lên đầu cột (việc mới đứng đầu cột). */
export function topPosition(tasksInColumn: Task[]): number {
  if (tasksInColumn.length === 0) return 0;
  return Math.min(...tasksInColumn.map((t) => t.position)) - 1;
}

export function sortByPosition(tasks: Task[]): Task[] {
  return [...tasks].sort(
    (a, b) => a.position - b.position || Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );
}

/**
 * Tính các cập nhật khi thả thẻ `activeId` vào cột `targetStatus`.
 * `overTaskId` là thẻ bị thả lên (null = vùng trống của cột → xuống cuối).
 * Đánh số lại position 0..n-1 cho cột đích; chỉ trả về những việc thay đổi.
 */
export function computeDrop(
  tasks: Task[],
  activeId: string,
  targetStatus: TaskStatus,
  overTaskId: string | null,
): TaskUpdate[] {
  const active = tasks.find((t) => t.id === activeId);
  if (!active || overTaskId === activeId) return [];

  const original = sortByPosition(tasks.filter((t) => t.status === targetStatus));
  const column = original.filter((t) => t.id !== activeId);

  let index = overTaskId ? column.findIndex((t) => t.id === overTaskId) : -1;
  if (index === -1) index = column.length;

  // Kéo xuống trong cùng cột: đặt sau thẻ bị thả lên (giống arrayMove của dnd-kit).
  if (active.status === targetStatus && overTaskId) {
    const from = original.findIndex((t) => t.id === activeId);
    const to = original.findIndex((t) => t.id === overTaskId);
    if (from < to) index += 1;
  }

  column.splice(index, 0, active);

  const statusChanged = active.status !== targetStatus;
  const updates: TaskUpdate[] = [];
  column.forEach((task, position) => {
    if (task.id === activeId && statusChanged) {
      updates.push({ id: task.id, patch: { status: targetStatus, position } });
    } else if (task.position !== position) {
      updates.push({ id: task.id, patch: { position } });
    }
  });
  return updates;
}
