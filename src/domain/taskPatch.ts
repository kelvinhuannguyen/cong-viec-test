import { stripUndefined } from '../lib/object';
import { applyStatusChange, normalizeTitle } from './rules';
import type { Task, TaskPatch, TaskStatus } from './task';

/** Cột đích khi patch đổi trạng thái mà không chỉ định vị trí (việc sẽ lên đầu cột đó); ngược lại null. */
export function columnChange(current: Task, patch: TaskPatch): TaskStatus | null {
  return patch.status !== undefined && patch.status !== current.status && patch.position === undefined
    ? patch.status
    : null;
}

/**
 * Áp patch lên một việc: bỏ khoá undefined, chuẩn hoá tên, cập nhật completedAt theo trạng thái,
 * đặt updatedAt. `topOfNewColumn` là vị trí đầu cột đích khi columnChange(...) khác null.
 * Trả về null nếu tên mới không hợp lệ.
 */
export function applyTaskPatch(current: Task, patch: TaskPatch, now: Date, topOfNewColumn?: number): Task | null {
  const clean = stripUndefined(patch);
  const next: Task = { ...current, ...clean, updatedAt: now.toISOString() };

  if (clean.title !== undefined) {
    const title = normalizeTitle(clean.title);
    if (!title) return null;
    next.title = title;
  }
  if (clean.status !== undefined) {
    Object.assign(next, applyStatusChange(current, clean.status, now));
    if (columnChange(current, patch) && topOfNewColumn !== undefined) next.position = topOfNewColumn;
  }
  return next;
}
