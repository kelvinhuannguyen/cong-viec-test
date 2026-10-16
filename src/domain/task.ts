export const TASK_STATUSES = ['todo', 'in_progress', 'done', 'on_hold'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const PRIORITIES = ['low', 'medium', 'high'] as const;
export type Priority = (typeof PRIORITIES)[number];

export const LABEL_COLORS = [
  'slate', 'red', 'orange', 'amber', 'green', 'teal', 'blue', 'violet', 'pink',
] as const;
export type LabelColor = (typeof LABEL_COLORS)[number];

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'Cần làm',
  in_progress: 'Đang làm',
  done: 'Đã xong',
  on_hold: 'Tạm hoãn',
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: 'Thấp',
  medium: 'Trung bình',
  high: 'Cao',
};

export const KANBAN_COLUMNS: TaskStatus[] = ['todo', 'in_progress', 'on_hold', 'done'];

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  dueAt: string | null;
  labelIds: string[];
  position: number;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface Label {
  id: string;
  name: string;
  color: LabelColor;
}

export interface NewTask {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: Priority;
  dueAt?: string | null;
  labelIds?: string[];
}

/** Dữ liệu đầy đủ từ form tạo / sửa: dùng được cho cả create và update. */
export type TaskInput = Required<NewTask>;

export type TaskPatch = Partial<
  Pick<Task, 'title' | 'description' | 'status' | 'priority' | 'dueAt' | 'labelIds' | 'position'>
>;

export interface TaskUpdate {
  id: string;
  patch: TaskPatch;
}

export interface NewLabel {
  name: string;
  color: LabelColor;
}

export type LabelPatch = Partial<NewLabel>;
