import { describe, expect, it } from 'vitest';
import { makeTask } from '../../test/factories';
import { getBackend } from '../index';
import { RepositoryError } from '../repository';
import { adoptForeignIds } from './createSupabaseRepositories';
import { toRepositoryError } from './errors';
import { fromLabelRow, fromTaskRow, toTaskRow, type TaskRow } from './mappers';

describe('mappers', () => {
  it('đổi hàng database sang Task, chuẩn hoá thời điểm về dạng toISOString', () => {
    const row: TaskRow = {
      id: 'a',
      title: 'Nộp thuế',
      description: '',
      status: 'todo',
      priority: 'high',
      due_at: '2026-10-20T16:59:00+00:00',
      label_ids: ['l1'],
      position: -1,
      created_at: '2026-10-17T02:00:00+00:00',
      updated_at: '2026-10-17T02:30:00.123+00:00',
      completed_at: null,
    };
    expect(fromTaskRow(row)).toEqual({
      id: 'a',
      title: 'Nộp thuế',
      description: '',
      status: 'todo',
      priority: 'high',
      dueAt: '2026-10-20T16:59:00.000Z',
      labelIds: ['l1'],
      position: -1,
      createdAt: '2026-10-17T02:00:00.000Z',
      updatedAt: '2026-10-17T02:30:00.123Z',
      completedAt: null,
    });
  });

  it('Task → hàng → Task giữ nguyên dữ liệu', () => {
    const task = makeTask({ dueAt: '2026-10-20T16:59:00.000Z', labelIds: ['x'], completedAt: null });
    expect(fromTaskRow(toTaskRow(task))).toEqual(task);
  });

  it('nhãn chỉ giữ id, tên, màu', () => {
    expect(fromLabelRow({ id: 'l', name: 'A', color: 'teal' })).toEqual({ id: 'l', name: 'A', color: 'teal' });
  });
});

describe('toRepositoryError', () => {
  const code = (e: Error) => (e instanceof RepositoryError ? e.code : 'khac');

  it('ánh xạ mã lỗi Postgres sang mã của app', () => {
    expect(code(toRepositoryError({ code: '23505' }, 'label'))).toBe('DUPLICATE_LABEL');
    expect(code(toRepositoryError({ code: '23514' }, 'label'))).toBe('INVALID_LABEL_NAME');
    expect(code(toRepositoryError({ code: '23514' }, 'task'))).toBe('INVALID_TITLE');
    expect(code(toRepositoryError({ code: 'PGRST116' }, 'task'))).toBe('NOT_FOUND');
    expect(code(toRepositoryError({ code: '22P02' }, 'task'))).toBe('NOT_FOUND');
    expect(code(toRepositoryError({ code: 'P0002' }, 'label'))).toBe('NOT_FOUND');
  });

  it('lỗi khác giữ thông điệp gốc', () => {
    const error = toRepositoryError({ code: '42501', message: 'permission denied' }, 'task');
    expect(error).not.toBeInstanceOf(RepositoryError);
    expect(error.message).toBe('permission denied');
  });
});

describe('getBackend', () => {
  it('đủ URL và key thì dùng Supabase, thiếu thì lưu trên máy', () => {
    expect(getBackend({ VITE_SUPABASE_URL: 'https://x.supabase.co', VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_x' })).toBe(
      'supabase',
    );
    expect(getBackend({ VITE_SUPABASE_URL: 'https://x.supabase.co', VITE_SUPABASE_PUBLISHABLE_KEY: ' ' })).toBe('local');
    expect(getBackend({})).toBe('local');
  });
});

describe('adoptForeignIds', () => {
  it('giữ id của mình, đổi id của tài khoản khác và đổi labelIds theo', () => {
    const mine = makeTask({ id: 'cua-toi', labelIds: ['nhan-la'] });
    const foreign = makeTask({ id: 'cua-nguoi-khac', labelIds: ['nhan-cua-toi', 'nhan-la'] });
    let n = 0;
    const result = adoptForeignIds(
      {
        tasks: [mine, foreign],
        labels: [
          { id: 'nhan-cua-toi', name: 'A', color: 'blue' },
          { id: 'nhan-la', name: 'B', color: 'red' },
        ],
      },
      new Set(['cua-toi']),
      new Set(['nhan-cua-toi']),
      () => `moi-${++n}`,
    );
    expect(result.labels.map((l) => l.id)).toEqual(['nhan-cua-toi', 'moi-1']);
    expect(result.tasks.map((t) => [t.id, t.labelIds])).toEqual([
      ['cua-toi', ['moi-1']],
      ['moi-2', ['nhan-cua-toi', 'moi-1']],
    ]);
  });
});
