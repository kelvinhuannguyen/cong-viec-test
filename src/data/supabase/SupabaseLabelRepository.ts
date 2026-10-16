import type { SupabaseClient } from '@supabase/supabase-js';
import { normalizeLabelName, sameLabelName } from '../../domain/rules';
import type { Label, LabelPatch, NewLabel } from '../../domain/task';
import { newId } from '../../lib/id';
import { stripUndefined } from '../../lib/object';
import { RepositoryError, type LabelRepository } from '../repository';
import { toRepositoryError } from './errors';
import { LABEL_COLUMNS, fromLabelRow, type LabelRow } from './mappers';

export class SupabaseLabelRepository implements LabelRepository {
  constructor(private readonly client: SupabaseClient) {}

  async list(): Promise<Label[]> {
    const { data, error } = await this.client.from('labels').select(LABEL_COLUMNS).order('created_at');
    if (error) throw toRepositoryError(error, 'label');
    return (data as LabelRow[]).map(fromLabelRow);
  }

  /**
   * Kiểm tra trùng tên phía client trước (so sánh giống bản Dexie, có chuẩn hoá Unicode);
   * chỉ mục duy nhất trên database là lớp chặn cuối.
   */
  private async assertUniqueName(name: string, exceptId?: string): Promise<void> {
    const all = await this.list();
    if (all.some((l) => l.id !== exceptId && sameLabelName(l.name, name))) {
      throw new RepositoryError('DUPLICATE_LABEL');
    }
  }

  async create(input: NewLabel): Promise<Label> {
    const name = normalizeLabelName(input.name);
    if (!name) throw new RepositoryError('INVALID_LABEL_NAME');
    await this.assertUniqueName(name);
    const { data, error } = await this.client
      .from('labels')
      .insert({ id: newId(), name, color: input.color })
      .select(LABEL_COLUMNS)
      .single();
    if (error) throw toRepositoryError(error, 'label');
    return fromLabelRow(data as LabelRow);
  }

  async update(id: string, patch: LabelPatch): Promise<Label> {
    const clean = stripUndefined(patch);
    const changes: Partial<LabelRow> = {};
    if (clean.name !== undefined) {
      const name = normalizeLabelName(clean.name);
      if (!name) throw new RepositoryError('INVALID_LABEL_NAME');
      await this.assertUniqueName(name, id);
      changes.name = name;
    }
    if (clean.color !== undefined) changes.color = clean.color;

    const query =
      Object.keys(changes).length === 0
        ? this.client.from('labels').select(LABEL_COLUMNS).eq('id', id).single()
        : this.client.from('labels').update(changes).eq('id', id).select(LABEL_COLUMNS).single();
    const { data, error } = await query;
    if (error) throw toRepositoryError(error, 'label');
    return fromLabelRow(data as LabelRow);
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.client.rpc('remove_label', { p_label_id: id });
    if (error) throw toRepositoryError(error, 'label');
  }
}
