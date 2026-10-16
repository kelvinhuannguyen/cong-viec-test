import type { SupabaseClient } from '@supabase/supabase-js';
import { planLabelImport, remapTaskLabels } from '../../domain/importMerge';
import type { Repositories } from '../repository';
import { toRepositoryError } from './errors';
import { toLabelRow, toTaskRow } from './mappers';
import { SupabaseLabelRepository } from './SupabaseLabelRepository';
import { SupabaseTaskRepository } from './SupabaseTaskRepository';

export function createSupabaseRepositories(client: SupabaseClient, now: () => Date = () => new Date()): Repositories {
  const tasks = new SupabaseTaskRepository(client, now);
  const labels = new SupabaseLabelRepository(client);
  return {
    tasks,
    labels,
    importData: async (data) => {
      // Gộp nhãn trùng tên với nhãn đã có trên tài khoản trước, rồi ghi cả hai bảng trong một giao dịch.
      const plan = planLabelImport(data.labels, await labels.list());
      const { error } = await client.rpc('import_data', {
        p_tasks: remapTaskLabels(data.tasks, plan.idMap).map(toTaskRow),
        p_labels: plan.labels.map(toLabelRow),
      });
      if (error) throw toRepositoryError(error, 'task');
    },
  };
}
