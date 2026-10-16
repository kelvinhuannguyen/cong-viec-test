import { topPosition } from '../../domain/kanban';
import { normalizeTitle } from '../../domain/rules';
import type { NewTask, Task, TaskPatch, TaskUpdate } from '../../domain/task';
import { applyTaskPatch, columnChange } from '../../domain/taskPatch';
import { newId } from '../../lib/id';
import { RepositoryError, type TaskRepository } from '../repository';
import type { AppDatabase } from './db';

export class DexieTaskRepository implements TaskRepository {
  constructor(
    private readonly db: AppDatabase,
    private readonly now: () => Date = () => new Date(),
  ) {}

  list(): Promise<Task[]> {
    return this.db.tasks.toArray();
  }

  create(input: NewTask): Promise<Task> {
    const title = normalizeTitle(input.title);
    if (!title) return Promise.reject(new RepositoryError('INVALID_TITLE'));
    return this.db.transaction('rw', this.db.tasks, async () => {
      const status = input.status ?? 'todo';
      const siblings = await this.db.tasks.where('status').equals(status).toArray();
      const ts = this.now().toISOString();
      const task: Task = {
        id: newId(),
        title,
        description: input.description ?? '',
        status,
        priority: input.priority ?? 'medium',
        dueAt: input.dueAt ?? null,
        labelIds: input.labelIds ?? [],
        position: topPosition(siblings),
        createdAt: ts,
        updatedAt: ts,
        completedAt: status === 'done' ? ts : null,
      };
      await this.db.tasks.add(task);
      return task;
    });
  }

  update(id: string, patch: TaskPatch): Promise<Task> {
    return this.db.transaction('rw', this.db.tasks, () => this.applyUpdate(id, patch, this.now()));
  }

  updateMany(updates: TaskUpdate[]): Promise<Task[]> {
    return this.db.transaction('rw', this.db.tasks, async () => {
      const now = this.now();
      const saved: Task[] = [];
      // Tuần tự: vị trí đầu cột của việc sau phải tính trên kết quả của việc trước.
      for (const { id, patch } of updates) saved.push(await this.applyUpdate(id, patch, now));
      return saved;
    });
  }

  /** Chỉ gọi bên trong giao dịch 'rw' trên bảng tasks. */
  private async applyUpdate(id: string, patch: TaskPatch, now: Date): Promise<Task> {
    const current = await this.db.tasks.get(id);
    if (!current) throw new RepositoryError('NOT_FOUND');
    const target = columnChange(current, patch);
    const top = target ? topPosition(await this.db.tasks.where('status').equals(target).toArray()) : undefined;
    const next = applyTaskPatch(current, patch, now, top);
    if (!next) throw new RepositoryError('INVALID_TITLE');
    await this.db.tasks.put(next);
    return next;
  }

  async remove(id: string): Promise<void> {
    await this.db.tasks.delete(id);
  }

  async restore(task: Task): Promise<void> {
    await this.db.tasks.put(task);
  }
}
