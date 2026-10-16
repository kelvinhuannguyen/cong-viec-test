import { createDexieRepositories } from './dexie/createDexieRepositories';
import { AppDatabase } from './dexie/db';
import type { Repositories } from './repository';

export { readLocalSnapshot } from './dexie/localSnapshot';

export type Backend = 'local' | 'supabase';

export interface BackendEnv {
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_PUBLISHABLE_KEY?: string;
}

/** Có đủ URL và publishable key của Supabase thì lưu trên Supabase (bắt buộc đăng nhập); không thì lưu trên máy. */
export function getBackend(env: BackendEnv = import.meta.env): Backend {
  return env.VITE_SUPABASE_URL?.trim() && env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ? 'supabase' : 'local';
}

/** Chế độ lưu trên máy (v1): IndexedDB qua Dexie. */
export function createDefaultRepositories(): Repositories {
  return createDexieRepositories(new AppDatabase());
}
