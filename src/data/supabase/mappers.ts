import type { Label, LabelColor, Priority, Task, TaskStatus } from '../../domain/task';

/** Hàng trong bảng public.tasks (không gồm user_id: database tự gán theo phiên đăng nhập). */
export interface TaskRow {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  due_at: string | null;
  label_ids: string[];
  position: number;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface LabelRow {
  id: string;
  name: string;
  color: LabelColor;
}

export const TASK_COLUMNS =
  'id,title,description,status,priority,due_at,label_ids,position,created_at,updated_at,completed_at';
export const LABEL_COLUMNS = 'id,name,color';

/** Postgres trả "2026-10-17T02:00:00+00:00"; app (và file sao lưu) dùng dạng toISOString "…Z". */
const iso = (value: string): string => new Date(value).toISOString();
const isoOrNull = (value: string | null): string | null => (value === null ? null : iso(value));

export function fromTaskRow(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    dueAt: isoOrNull(row.due_at),
    labelIds: row.label_ids ?? [],
    position: Number(row.position),
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
    completedAt: isoOrNull(row.completed_at),
  };
}

export function toTaskRow(task: Task): TaskRow {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    due_at: task.dueAt,
    label_ids: task.labelIds,
    position: task.position,
    created_at: task.createdAt,
    updated_at: task.updatedAt,
    completed_at: task.completedAt,
  };
}

export function fromLabelRow(row: LabelRow): Label {
  return { id: row.id, name: row.name, color: row.color };
}

export function toLabelRow(label: Label): LabelRow {
  return { id: label.id, name: label.name, color: label.color };
}
