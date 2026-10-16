import Dexie from 'dexie';
import type { Label, Task } from '../../domain/task';
import { AppDatabase } from './db';

export const LOCAL_DB_NAME = 'cong-viec-cua-toi';

/** Đọc dữ liệu IndexedDB của chế độ lưu trên máy (để đưa lên tài khoản). Không có CSDL thì trả về rỗng. */
export async function readLocalSnapshot(name = LOCAL_DB_NAME): Promise<{ tasks: Task[]; labels: Label[] }> {
  if (typeof indexedDB === 'undefined' || !(await Dexie.exists(name))) return { tasks: [], labels: [] };
  const db = new AppDatabase(name, { onVersionChange: () => undefined });
  try {
    const [tasks, labels] = await Promise.all([db.tasks.toArray(), db.labels.toArray()]);
    return { tasks, labels };
  } finally {
    db.close();
  }
}
