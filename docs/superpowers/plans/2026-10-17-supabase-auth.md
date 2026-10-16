# Supabase + đăng nhập — Implementation Plan

> Thực hiện trực tiếp trong phiên (executing inline), theo spec `docs/superpowers/specs/2026-10-17-supabase-auth-design.md`.

**Goal:** Lưu dữ liệu trên Supabase (dự án `cong-viec-test`), bắt buộc đăng nhập bằng Email + mật khẩu hoặc Google, đưa dữ liệu IndexedDB cũ lên tài khoản.

**Architecture:** `getBackend()` chọn `local` (Dexie, như v1) hoặc `supabase` theo biến môi trường. Ở chế độ Supabase, `AuthGate` giữ phiên đăng nhập, rồi tạo `SupabaseRepositories` cài đặt đúng interface `Repositories` hiện có, nên giao diện không đổi. Bảo mật bằng RLS theo `user_id = auth.uid()`.

**Tech Stack:** `@supabase/supabase-js` 2.x, Postgres 17 (Supabase), React 19, TanStack Query 5, Vitest.

## Global Constraints

- Chỉ `src/data/supabase/` được import `@supabase/supabase-js`; chỉ `src/data/dexie/` được import `dexie`.
- Chỉ dùng publishable key ở client. Không bao giờ dùng secret / service_role key.
- Mọi bảng trong `public`: bật RLS, `grant` tường minh cho `authenticated`, thu hồi quyền của `anon`.
- Hàm SQL: `security invoker`, `set search_path = ''`, chỉ `authenticated` được `execute`.
- Toàn bộ chữ trên giao diện là tiếng Việt; giao diện theo hệ Zinc + xanh ngọc hiện có.
- Không có biến Supabase → chế độ local, toàn bộ test cũ và e2e vẫn qua.

## Task 1: Database

Migration `init_tasks_labels` (lưu thêm ở `supabase/migrations/20261017000000_init_tasks_labels.sql`):

- Bảng `labels(id uuid pk, user_id uuid default auth.uid() → auth.users on delete cascade, name text 1–30, color text ∈ 9 màu, created_at)`; unique `(user_id, lower(name))`.
- Bảng `tasks(id uuid pk, user_id, title text 1–200, description text default '', status, priority, due_at timestamptz, label_ids text[] default '{}', position float8, created_at, updated_at, completed_at)`; index `(user_id, status)`.
- RLS + 4 policy / bảng với `(select auth.uid()) = user_id`, `to authenticated`.
- `revoke all … from anon, public`; `grant select, insert, update, delete … to authenticated`.
- Hàm `remove_label(p_label_id uuid)`, `upsert_tasks(p_tasks jsonb)`, `import_data(p_tasks jsonb, p_labels jsonb)`.
- Kiểm tra: `get_advisors(security)` không còn cảnh báo về hai bảng / ba hàm; gọi REST bằng publishable key không có phiên → không đọc được hàng nào.

## Task 2: Repository Supabase

- `npm install @supabase/supabase-js@^2` (khoá phiên bản trong lockfile).
- `src/data/supabase/{client.ts, mappers.ts, errors.ts, SupabaseTaskRepository.ts, SupabaseLabelRepository.ts, createSupabaseRepositories.ts}`.
- Tách logic áp patch dùng chung giữa Dexie và Supabase vào `src/domain/taskPatch.ts` (`applyTaskPatch(current, patch, now, topOfColumn)`), Dexie chuyển sang dùng nó.
- Test: `mappers.test.ts`, `errors.test.ts`, `taskPatch.test.ts`; `supabase.contract.test.ts` chạy `describeRepositoryContract` khi có `SUPABASE_TEST_EMAIL` / `SUPABASE_TEST_PASSWORD`, không có thì `describe.skip`.

## Task 3: Chọn backend và đăng nhập

- `src/data/index.ts`: `getBackend(env)` (+ test).
- `src/features/auth/`: `AuthGate`, `LoginPage`, `ResetPasswordPage`, `authErrors.ts` (+ test), `UserMenu` (thanh bên + trang Cài đặt trên điện thoại).
- `App.tsx`: `local` → `StorageGate` như cũ; `supabase` → `AuthGate`.
- `queryClient.ts`: cấu hình theo backend; `OfflineBanner`.

## Task 4: Đưa dữ liệu cũ lên

- `src/features/auth/LocalImportPrompt.tsx` (+ test): đọc IndexedDB cũ, hỏi một lần cho mỗi tài khoản, gán id mới cho việc và nhãn, gộp nhãn trùng tên, gọi `importData`.

## Task 5: Hướng dẫn và kiểm tra

- `docs/supabase-setup.md`: URL Configuration, Google OAuth, tài khoản test.
- Playwright build với biến Supabase rỗng (chế độ local).
- `npm test`, `npm run typecheck`, `npm run build`, `npm run e2e`; review code; chạy thử màn hình đăng nhập trên trình duyệt.
