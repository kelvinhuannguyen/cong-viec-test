import Dexie, { type EntityTable } from 'dexie';
import type { Label, Task } from '../../domain/task';

export const VERSION_CHANGE_MESSAGE =
  'Ứng dụng vừa được cập nhật ở một tab khác nên tab này tạm dừng lưu dữ liệu. Tải lại trang ngay?';

/** Mặc định khi tab khác nâng cấp cấu trúc dữ liệu: hỏi người dùng rồi tải lại trang. */
export function promptReload(): void {
  if (window.confirm(VERSION_CHANGE_MESSAGE)) window.location.reload();
}

export interface AppDatabaseOptions {
  onVersionChange?: () => void;
}

export class AppDatabase extends Dexie {
  tasks!: EntityTable<Task, 'id'>;
  labels!: EntityTable<Label, 'id'>;

  constructor(name = 'cong-viec-cua-toi', { onVersionChange = promptReload }: AppDatabaseOptions = {}) {
    super(name);
    // Đổi cấu trúc về sau: thêm this.version(2).stores(...).upgrade(...)
    this.version(1).stores({
      tasks: 'id, status, dueAt, createdAt, completedAt',
      labels: 'id',
    });
    // Tab khác (bản mới hơn) cần nâng cấp hoặc xoá CSDL: đóng kết nối để không chặn nó,
    // không tự mở lại với cấu trúc cũ, rồi xin tải lại trang để chạy bản mới.
    this.on('versionchange', () => {
      this.close();
      onVersionChange();
      return false; // đã tự xử lý, bỏ qua cách xử lý mặc định của Dexie
    });
  }
}
