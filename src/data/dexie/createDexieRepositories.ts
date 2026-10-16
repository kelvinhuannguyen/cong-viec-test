import { planLabelImport, remapTaskLabels } from '../../domain/importMerge';
import type { Repositories } from '../repository';
import type { AppDatabase } from './db';
import { DexieLabelRepository } from './DexieLabelRepository';
import { DexieTaskRepository } from './DexieTaskRepository';

export function createDexieRepositories(db: AppDatabase, now: () => Date = () => new Date()): Repositories {
  return {
    tasks: new DexieTaskRepository(db, now),
    labels: new DexieLabelRepository(db),
    importData: ({ tasks, labels }) =>
      db.transaction('rw', db.tasks, db.labels, async () => {
        const plan = planLabelImport(labels, await db.labels.toArray());
        await db.labels.bulkPut(plan.labels);
        await db.tasks.bulkPut(remapTaskLabels(tasks, plan.idMap));
      }),
  };
}
