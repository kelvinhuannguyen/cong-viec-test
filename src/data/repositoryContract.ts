import { beforeEach, describe, expect, it } from 'vitest';
import type { Repositories } from './repository';

export function describeRepositoryContract(
  name: string,
  factory: (now: () => Date) => Repositories,
): void {
  describe(`Repository contract: ${name}`, () => {
    let clock: Date;
    let repos: Repositories;
    const tick = (minutes: number) => {
      clock = new Date(clock.getTime() + minutes * 60_000);
    };

    beforeEach(() => {
      clock = new Date(2026, 9, 16, 9, 0);
      repos = factory(() => clock);
    });

    describe('tasks', () => {
      it('tạo việc với giá trị mặc định và tên đã trim', async () => {
        const task = await repos.tasks.create({ title: '  Viết báo cáo  ' });
        expect(task).toMatchObject({
          title: 'Viết báo cáo',
          description: '',
          status: 'todo',
          priority: 'medium',
          dueAt: null,
          labelIds: [],
          completedAt: null,
          createdAt: clock.toISOString(),
          updatedAt: clock.toISOString(),
        });
        expect(task.id).toMatch(/^[0-9a-f-]{36}$/);
        expect(await repos.tasks.list()).toEqual([task]);
      });

      it('từ chối tên rỗng', async () => {
        await expect(repos.tasks.create({ title: '   ' })).rejects.toMatchObject({ code: 'INVALID_TITLE' });
      });

      it('tạo việc ở trạng thái Đã xong thì có completedAt', async () => {
        const task = await repos.tasks.create({ title: 'A', status: 'done' });
        expect(task.completedAt).toBe(clock.toISOString());
      });

      it('việc mới đứng đầu cột', async () => {
        const a = await repos.tasks.create({ title: 'A' });
        const b = await repos.tasks.create({ title: 'B' });
        expect(b.position).toBeLessThan(a.position);
      });

      it('chuyển sang Đã xong ghi completedAt, rời khỏi thì xoá', async () => {
        const task = await repos.tasks.create({ title: 'A' });
        tick(5);
        const done = await repos.tasks.update(task.id, { status: 'done' });
        expect(done.completedAt).toBe(clock.toISOString());
        expect(done.updatedAt).toBe(clock.toISOString());
        const back = await repos.tasks.update(task.id, { status: 'in_progress' });
        expect(back.completedAt).toBeNull();
      });

      it('đổi trạng thái đưa việc lên đầu cột mới', async () => {
        const a = await repos.tasks.create({ title: 'A' });
        const b = await repos.tasks.create({ title: 'B', status: 'in_progress' });
        const moved = await repos.tasks.update(a.id, { status: 'in_progress' });
        expect(moved.position).toBeLessThan(b.position);
      });

      it('update giữ trường không có trong patch và bỏ qua undefined', async () => {
        const dueAt = new Date(2026, 9, 20, 23, 59).toISOString();
        const task = await repos.tasks.create({ title: 'A', dueAt });
        const updated = await repos.tasks.update(task.id, { priority: 'high', dueAt: undefined });
        expect(updated).toMatchObject({ title: 'A', priority: 'high', dueAt });
      });

      it('update từ chối tên không hợp lệ', async () => {
        const task = await repos.tasks.create({ title: 'A' });
        await expect(repos.tasks.update(task.id, { title: ' ' })).rejects.toMatchObject({ code: 'INVALID_TITLE' });
      });

      it('update id không tồn tại', async () => {
        await expect(repos.tasks.update('khong-co', { title: 'X' })).rejects.toMatchObject({ code: 'NOT_FOUND' });
      });

      it('remove rồi restore khôi phục y nguyên', async () => {
        const task = await repos.tasks.create({ title: 'A', description: 'mô tả' });
        await repos.tasks.remove(task.id);
        expect(await repos.tasks.list()).toEqual([]);
        await repos.tasks.restore(task);
        expect(await repos.tasks.list()).toEqual([task]);
      });

      it('updateMany lưu mọi thay đổi và trả về việc đã lưu theo thứ tự', async () => {
        const a = await repos.tasks.create({ title: 'A' });
        const b = await repos.tasks.create({ title: 'B' });
        tick(5);
        const saved = await repos.tasks.updateMany([
          { id: b.id, patch: { status: 'done', position: 10 } },
          { id: a.id, patch: { position: 20 } },
        ]);
        expect(saved.map((t) => [t.id, t.status, t.position])).toEqual([
          [b.id, 'done', 10],
          [a.id, 'todo', 20],
        ]);
        expect(saved[0].completedAt).toBe(clock.toISOString());
        const byId = new Map((await repos.tasks.list()).map((t) => [t.id, t]));
        expect(byId.get(a.id)).toEqual(saved[1]);
        expect(byId.get(b.id)).toEqual(saved[0]);
        expect(await repos.tasks.updateMany([])).toEqual([]);
      });

      it('updateMany chuyển nhiều việc sang cột mới thì việc sau đứng trên việc trước', async () => {
        const a = await repos.tasks.create({ title: 'A' });
        const b = await repos.tasks.create({ title: 'B' });
        const [movedA, movedB] = await repos.tasks.updateMany([
          { id: a.id, patch: { status: 'on_hold' } },
          { id: b.id, patch: { status: 'on_hold' } },
        ]);
        expect(movedB.position).toBeLessThan(movedA.position);
      });

      it('updateMany có một việc lỗi thì không lưu việc nào', async () => {
        const a = await repos.tasks.create({ title: 'A' });
        const b = await repos.tasks.create({ title: 'B' });
        await expect(
          repos.tasks.updateMany([
            { id: a.id, patch: { status: 'done' } },
            { id: 'khong-co', patch: { status: 'done' } },
          ]),
        ).rejects.toMatchObject({ code: 'NOT_FOUND' });
        await expect(
          repos.tasks.updateMany([
            { id: a.id, patch: { status: 'done' } },
            { id: b.id, patch: { title: '  ' } },
          ]),
        ).rejects.toMatchObject({ code: 'INVALID_TITLE' });
        const titles = (await repos.tasks.list()).map((t) => [t.title, t.status]).sort();
        expect(titles).toEqual([
          ['A', 'todo'],
          ['B', 'todo'],
        ]);
      });
    });

    describe('labels', () => {
      it('tạo nhãn và chống trùng tên không phân biệt hoa thường', async () => {
        const label = await repos.labels.create({ name: ' Công việc ', color: 'blue' });
        expect(label).toMatchObject({ name: 'Công việc', color: 'blue' });
        await expect(repos.labels.create({ name: 'CÔNG VIỆC', color: 'red' })).rejects.toMatchObject({
          code: 'DUPLICATE_LABEL',
        });
        await expect(repos.labels.create({ name: '', color: 'red' })).rejects.toMatchObject({
          code: 'INVALID_LABEL_NAME',
        });
      });

      it('đổi tên sang tên trùng bị từ chối, đổi chính nó thì được', async () => {
        const a = await repos.labels.create({ name: 'A', color: 'blue' });
        await repos.labels.create({ name: 'B', color: 'blue' });
        await expect(repos.labels.update(a.id, { name: 'b' })).rejects.toMatchObject({ code: 'DUPLICATE_LABEL' });
        expect(await repos.labels.update(a.id, { name: 'a', color: 'green' })).toEqual({
          id: a.id,
          name: 'a',
          color: 'green',
        });
      });

      it('xoá nhãn gỡ nhãn khỏi các việc', async () => {
        const label = await repos.labels.create({ name: 'A', color: 'blue' });
        const task = await repos.tasks.create({ title: 'T', labelIds: [label.id, 'khac'] });
        await repos.labels.remove(label.id);
        expect(await repos.labels.list()).toEqual([]);
        const [saved] = await repos.tasks.list();
        expect(saved.id).toBe(task.id);
        expect(saved.labelIds).toEqual(['khac']);
      });
    });

    it('importData gộp theo id', async () => {
      const existing = await repos.tasks.create({ title: 'Cũ' });
      const incoming = { ...existing, title: 'Mới' };
      const extra = { ...existing, id: '00000000-0000-4000-8000-000000000001', title: 'Thêm' };
      const label = { id: '00000000-0000-4000-8000-000000000002', name: 'Nhập', color: 'teal' as const };
      await repos.importData({ tasks: [incoming, extra], labels: [label] });
      const titles = (await repos.tasks.list()).map((t) => t.title).sort();
      expect(titles).toEqual(['Mới', 'Thêm']);
      expect(await repos.labels.list()).toEqual([label]);
    });
  });
}
