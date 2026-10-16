import type { SupabaseClient } from '@supabase/supabase-js';
import { normalizeTitle } from '../../domain/rules';
import type { NewTask, Task, TaskPatch, TaskStatus, TaskUpdate } from '../../domain/task';
import { applyTaskPatch, columnChange } from '../../domain/taskPatch';
import { newId } from '../../lib/id';
import { RepositoryError, type TaskRepository } from '../repository';
import { toRepositoryError } from './errors';
import { TASK_COLUMNS, fromTaskRow, toTaskRow, type TaskRow } from './mappers';
import { fetchAllPages } from './paginate';

export class SupabaseTaskRepository implements TaskRepository {
  constructor(
    private readonly client: SupabaseClient,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async list(): Promise<Task[]> {
    const { data, error } = await fetchAllPages<TaskRow>((from, to) =>
      this.client.from('tasks').select(TASK_COLUMNS).order('created_at').order('id').range(from, to),
    );
    if (error) throw toRepositoryError(error, 'task');
    return data.map(fromTaskRow);
  }

  /**
   * Vị trí đầu cột `status`: nhỏ hơn mọi việc trong cột, tính cả những việc đang đổi trong `working`
   * (chưa ghi xuống database) thay cho bản cũ của chúng.
   */
  private async topOfColumn(status: TaskStatus, working: Map<string, Task>): Promise<number> {
    let query = this.client.from('tasks').select('position').eq('status', status);
    if (working.size > 0) query = query.not('id', 'in', `(${[...working.keys()].join(',')})`);
    const { data, error } = await query.order('position').limit(1);
    if (error) throw toRepositoryError(error, 'task');
    const positions = [
      ...(data as { position: number }[]).map((r) => Number(r.position)),
      ...[...working.values()].filter((t) => t.status === status).map((t) => t.position),
    ];
    return positions.length === 0 ? 0 : Math.min(...positions) - 1;
  }

  async create(input: NewTask): Promise<Task> {
    const title = normalizeTitle(input.title);
    if (!title) throw new RepositoryError('INVALID_TITLE');
    const status = input.status ?? 'todo';
    const ts = this.now().toISOString();
    const task: Task = {
      id: newId(),
      title,
      description: input.description ?? '',
      status,
      priority: input.priority ?? 'medium',
      dueAt: input.dueAt ?? null,
      labelIds: input.labelIds ?? [],
      position: await this.topOfColumn(status, new Map()),
      createdAt: ts,
      updatedAt: ts,
      completedAt: status === 'done' ? ts : null,
    };
    const { data, error } = await this.client.from('tasks').insert(toTaskRow(task)).select(TASK_COLUMNS).single();
    if (error) throw toRepositoryError(error, 'task');
    return fromTaskRow(data as TaskRow);
  }

  async update(id: string, patch: TaskPatch): Promise<Task> {
    const [saved] = await this.updateMany([{ id, patch }]);
    return saved;
  }

  async updateMany(updates: TaskUpdate[]): Promise<Task[]> {
    if (updates.length === 0) return [];
    const ids = [...new Set(updates.map((u) => u.id))];
    const { data, error } = await this.client.from('tasks').select(TASK_COLUMNS).in('id', ids);
    if (error) throw toRepositoryError(error, 'task');

    const working = new Map((data as TaskRow[]).map((row) => [row.id, fromTaskRow(row)]));
    const now = this.now();
    const saved: Task[] = [];
    // Tuần tự: vị trí đầu cột của việc sau phải tính trên kết quả của việc trước.
    for (const { id, patch } of updates) {
      const current = working.get(id);
      if (!current) throw new RepositoryError('NOT_FOUND');
      const target = columnChange(current, patch);
      const top = target ? await this.topOfColumn(target, working) : undefined;
      const next = applyTaskPatch(current, patch, now, top);
      if (!next) throw new RepositoryError('INVALID_TITLE');
      working.set(id, next);
      saved.push(next);
    }

    // Ghi tất cả trong một giao dịch; mỗi id chỉ một hàng (bản cuối cùng).
    const rows = [...new Map(saved.map((t) => [t.id, toTaskRow(t)])).values()];
    const result = await this.client.rpc('upsert_tasks', { p_tasks: rows });
    if (result.error) throw toRepositoryError(result.error, 'task');
    return saved;
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.client.from('tasks').delete().eq('id', id);
    if (error) throw toRepositoryError(error, 'task');
  }

  async restore(task: Task): Promise<void> {
    const { error } = await this.client.rpc('upsert_tasks', { p_tasks: [toTaskRow(task)] });
    if (error) throw toRepositoryError(error, 'task');
  }
}
