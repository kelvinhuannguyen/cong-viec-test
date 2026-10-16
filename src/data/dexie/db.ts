import Dexie, { type EntityTable } from 'dexie';
import type { Label, Task } from '../../domain/task';

export class AppDatabase extends Dexie {
  tasks!: EntityTable<Task, 'id'>;
  labels!: EntityTable<Label, 'id'>;

  constructor(name = 'cong-viec-cua-toi') {
    super(name);
    // Đổi cấu trúc về sau: thêm this.version(2).stores(...).upgrade(...)
    this.version(1).stores({
      tasks: 'id, status, dueAt, createdAt, completedAt',
      labels: 'id',
    });
  }
}
