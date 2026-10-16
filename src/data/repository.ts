import type { Label, LabelPatch, NewLabel, NewTask, Task, TaskPatch } from '../domain/task';

export interface TaskRepository {
  list(): Promise<Task[]>;
  create(input: NewTask): Promise<Task>;
  update(id: string, patch: TaskPatch): Promise<Task>;
  remove(id: string): Promise<void>;
  /** Ghi lại nguyên vẹn một việc đã xoá (phục vụ "Hoàn tác"). */
  restore(task: Task): Promise<void>;
}

export interface LabelRepository {
  list(): Promise<Label[]>;
  create(input: NewLabel): Promise<Label>;
  update(id: string, patch: LabelPatch): Promise<Label>;
  /** Xoá nhãn và gỡ nhãn khỏi mọi việc đang dùng. */
  remove(id: string): Promise<void>;
}

export interface Repositories {
  tasks: TaskRepository;
  labels: LabelRepository;
  /** Gộp theo id (trùng thì ghi đè) trong một giao dịch. */
  importData(data: { tasks: Task[]; labels: Label[] }): Promise<void>;
}

export type RepositoryErrorCode = 'NOT_FOUND' | 'INVALID_TITLE' | 'INVALID_LABEL_NAME' | 'DUPLICATE_LABEL';

export class RepositoryError extends Error {
  readonly code: RepositoryErrorCode;

  constructor(code: RepositoryErrorCode) {
    super(code);
    this.name = 'RepositoryError';
    this.code = code;
  }
}
