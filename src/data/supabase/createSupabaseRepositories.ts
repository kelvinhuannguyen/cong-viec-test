import type { SupabaseClient } from '@supabase/supabase-js';
import { planLabelImport, remapTaskLabels } from '../../domain/importMerge';
import type { Label, Task } from '../../domain/task';
import { newId } from '../../lib/id';
import type { Repositories } from '../repository';
import { toRepositoryError } from './errors';
import { toLabelRow, toTaskRow } from './mappers';
import { SupabaseLabelRepository } from './SupabaseLabelRepository';
import { SupabaseTaskRepository } from './SupabaseTaskRepository';

/**
 * Giữ id của việc / nhãn đã thuộc tài khoản này (gộp theo id), gán id mới cho phần còn lại
 * và đổi labelIds theo. Dùng khi id trong file trùng với dữ liệu của tài khoản khác.
 */
export function adoptForeignIds(
  data: { tasks: Task[]; labels: Label[] },
  ownTaskIds: Set<string>,
  ownLabelIds: Set<string>,
  makeId: () => string,
): { tasks: Task[]; labels: Label[] } {
  const labelIds = new Map(data.labels.map((l) => [l.id, ownLabelIds.has(l.id) ? l.id : makeId()]));
  return {
    labels: data.labels.map((l) => ({ ...l, id: labelIds.get(l.id)! })),
    tasks: data.tasks.map((t) => ({
      ...t,
      id: ownTaskIds.has(t.id) ? t.id : makeId(),
      labelIds: t.labelIds.map((id) => labelIds.get(id) ?? id),
    })),
  };
}

export function createSupabaseRepositories(client: SupabaseClient, now: () => Date = () => new Date()): Repositories {
  const tasks = new SupabaseTaskRepository(client, now);
  const labels = new SupabaseLabelRepository(client);

  async function writeImport(data: { tasks: Task[]; labels: Label[] }, existingLabels: Label[]) {
    // Gộp nhãn trùng tên với nhãn đã có trên tài khoản, rồi ghi cả hai bảng trong một giao dịch.
    const plan = planLabelImport(data.labels, existingLabels);
    return client.rpc('import_data', {
      p_tasks: remapTaskLabels(data.tasks, plan.idMap).map(toTaskRow),
      p_labels: plan.labels.map(toLabelRow),
    });
  }

  return {
    tasks,
    labels,
    importData: async (data) => {
      const existingLabels = await labels.list();
      const first = await writeImport(data, existingLabels);
      if (!first.error) return;
      // 42501: id thuộc tài khoản khác (RLS chặn ghi đè); 22P02: id không phải uuid (file sửa tay).
      // Giữ nguyên dữ liệu của chính mình, đổi id cho phần còn lại rồi ghi lại.
      if (first.error.code !== '42501' && first.error.code !== '22P02') throw toRepositoryError(first.error, 'task');
      const ownTaskIds = new Set((await tasks.list()).map((t) => t.id));
      const ownLabelIds = new Set(existingLabels.map((l) => l.id));
      const retry = await writeImport(adoptForeignIds(data, ownTaskIds, ownLabelIds, newId), existingLabels);
      if (retry.error) throw toRepositoryError(retry.error, 'task');
    },
  };
}
