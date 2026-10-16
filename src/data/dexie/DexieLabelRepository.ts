import { normalizeLabelName, sameLabelName } from '../../domain/rules';
import type { Label, LabelPatch, NewLabel } from '../../domain/task';
import { newId } from '../../lib/id';
import { stripUndefined } from '../../lib/object';
import { RepositoryError, type LabelRepository } from '../repository';
import type { AppDatabase } from './db';

export class DexieLabelRepository implements LabelRepository {
  constructor(private readonly db: AppDatabase) {}

  list(): Promise<Label[]> {
    return this.db.labels.toArray();
  }

  private async assertUniqueName(name: string, exceptId?: string): Promise<void> {
    const all = await this.db.labels.toArray();
    if (all.some((l) => l.id !== exceptId && sameLabelName(l.name, name))) {
      throw new RepositoryError('DUPLICATE_LABEL');
    }
  }

  create(input: NewLabel): Promise<Label> {
    const name = normalizeLabelName(input.name);
    if (!name) return Promise.reject(new RepositoryError('INVALID_LABEL_NAME'));
    return this.db.transaction('rw', this.db.labels, async () => {
      await this.assertUniqueName(name);
      const label: Label = { id: newId(), name, color: input.color };
      await this.db.labels.add(label);
      return label;
    });
  }

  update(id: string, patch: LabelPatch): Promise<Label> {
    return this.db.transaction('rw', this.db.labels, async () => {
      const current = await this.db.labels.get(id);
      if (!current) throw new RepositoryError('NOT_FOUND');
      const clean = stripUndefined(patch);
      const next: Label = { ...current, ...clean };
      if (clean.name !== undefined) {
        const name = normalizeLabelName(clean.name);
        if (!name) throw new RepositoryError('INVALID_LABEL_NAME');
        await this.assertUniqueName(name, id);
        next.name = name;
      }
      await this.db.labels.put(next);
      return next;
    });
  }

  remove(id: string): Promise<void> {
    return this.db.transaction('rw', this.db.tasks, this.db.labels, async () => {
      await this.db.tasks
        .filter((t) => t.labelIds.includes(id))
        .modify((t) => {
          t.labelIds = t.labelIds.filter((labelId) => labelId !== id);
        });
      await this.db.labels.delete(id);
    });
  }
}
