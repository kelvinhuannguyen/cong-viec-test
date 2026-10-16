import Dexie from 'dexie';
import { expect, it, vi } from 'vitest';
import { AppDatabase, promptReload, VERSION_CHANGE_MESSAGE } from './db';

it('tab khác nâng cấp cấu trúc thì đóng kết nối và xin tải lại', async () => {
  const name = `test-${crypto.randomUUID()}`;
  const onVersionChange = vi.fn();
  const db = new AppDatabase(name, { onVersionChange });
  await db.open();

  const newer = new Dexie(name);
  newer.version(2).stores({ tasks: 'id, status, dueAt, createdAt, completedAt, priority', labels: 'id' });
  await newer.open(); // treo nếu tab cũ không đóng kết nối

  expect(onVersionChange).toHaveBeenCalledTimes(1);
  expect(db.isOpen()).toBe(false);
  // Không tự mở lại bằng cấu trúc cũ.
  await expect(db.tasks.toArray()).rejects.toMatchObject({ name: 'DatabaseClosedError' });
  newer.close();
});

it('mặc định hỏi người dùng có tải lại không', () => {
  const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
  promptReload();
  expect(confirm).toHaveBeenCalledWith(VERSION_CHANGE_MESSAGE);
});
