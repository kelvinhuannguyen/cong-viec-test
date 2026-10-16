import { describe, expect, it } from 'vitest';
import { makeTask } from '../test/factories';
import { applyTaskPatch, columnChange } from './taskPatch';

const now = new Date(2026, 9, 17, 9, 0);

describe('columnChange', () => {
  it('trả về cột đích khi đổi trạng thái mà không có position', () => {
    const task = makeTask({ status: 'todo' });
    expect(columnChange(task, { status: 'done' })).toBe('done');
    expect(columnChange(task, { status: 'done', position: 3 })).toBeNull();
    expect(columnChange(task, { status: 'todo' })).toBeNull();
    expect(columnChange(task, { title: 'X' })).toBeNull();
  });
});

describe('applyTaskPatch', () => {
  it('giữ trường không có trong patch, bỏ qua undefined, đặt updatedAt', () => {
    const task = makeTask({ title: 'A', dueAt: '2026-10-20T16:59:00.000Z' });
    const next = applyTaskPatch(task, { priority: 'high', dueAt: undefined }, now);
    expect(next).toMatchObject({ title: 'A', priority: 'high', dueAt: task.dueAt, updatedAt: now.toISOString() });
  });

  it('chuẩn hoá tên; tên rỗng thì trả về null', () => {
    expect(applyTaskPatch(makeTask(), { title: '  B  ' }, now)?.title).toBe('B');
    expect(applyTaskPatch(makeTask(), { title: '   ' }, now)).toBeNull();
  });

  it('chuyển sang Đã xong ghi completedAt và đặt vị trí đầu cột mới', () => {
    const next = applyTaskPatch(makeTask({ status: 'todo', position: 5 }), { status: 'done' }, now, -2);
    expect(next).toMatchObject({ status: 'done', completedAt: now.toISOString(), position: -2 });
  });

  it('có position tường minh thì không dùng đầu cột', () => {
    const next = applyTaskPatch(makeTask({ status: 'todo' }), { status: 'done', position: 7 }, now, -2);
    expect(next?.position).toBe(7);
  });
});
