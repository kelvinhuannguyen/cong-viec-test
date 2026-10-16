import { createDexieRepositories } from './dexie/createDexieRepositories';
import { AppDatabase } from './dexie/db';
import type { Repositories } from './repository';

/** Nơi duy nhất chọn bản cài đặt lưu trữ. Giai đoạn Supabase: đổi ở đây. */
export function createDefaultRepositories(): Repositories {
  return createDexieRepositories(new AppDatabase());
}
