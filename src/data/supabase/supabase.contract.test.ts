import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { afterAll, beforeAll, beforeEach, describe } from 'vitest';
import { describeRepositoryContract } from '../repositoryContract';
import { createSupabaseRepositories } from './createSupabaseRepositories';

/**
 * Chạy bộ test hợp đồng với Supabase thật, bằng một tài khoản test riêng.
 * Bật bằng cách thêm vào .env.test.local:
 *   SUPABASE_TEST_EMAIL=...
 *   SUPABASE_TEST_PASSWORD=...
 * (URL và publishable key lấy từ .env.local). Không có thì bỏ qua.
 */
const url = process.env.SUPABASE_TEST_URL ?? '';
const key = process.env.SUPABASE_TEST_KEY ?? '';
const email = process.env.SUPABASE_TEST_EMAIL ?? '';
const password = process.env.SUPABASE_TEST_PASSWORD ?? '';
const enabled = Boolean(url && key && email && password);

(enabled ? describe : describe.skip)('Supabase (tài khoản test)', () => {
  let client: SupabaseClient;

  beforeAll(async () => {
    client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
  });

  // Xoá sạch dữ liệu của tài khoản test trước mỗi bài (RLS giới hạn trong dữ liệu của chính nó).
  beforeEach(async () => {
    const everything = '00000000-0000-0000-0000-000000000000';
    await client.from('tasks').delete().neq('id', everything);
    await client.from('labels').delete().neq('id', everything);
  });

  afterAll(async () => {
    await client?.auth.signOut();
  });

  describeRepositoryContract('Supabase', (now) => createSupabaseRepositories(client, now));
});
