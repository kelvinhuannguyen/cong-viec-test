# Thiết kế: Kết nối Supabase và đăng nhập — "Công Việc Của Tôi" v2

- **Ngày:** 2026-10-17
- **Trạng thái:** Đã duyệt thiết kế, chờ duyệt spec
- **Nền tảng:** v1 (spec `2026-10-16-cong-viec-cua-toi-design.md`), giao diện Zinc + xanh ngọc đã có trên `master`
- **Dự án Supabase:** `cong-viec-test` (ref `gagynghwjonksipejpfb`, khu vực `ap-southeast-1`)

## 1. Mục tiêu

Chuyển nơi lưu dữ liệu từ IndexedDB sang Supabase, có đăng nhập, để một người dùng thấy cùng dữ liệu trên mọi thiết bị.

- Đăng nhập bằng **Email + mật khẩu** (có tạo tài khoản, xác nhận email, quên mật khẩu) và **Google**.
- **Bắt buộc đăng nhập** khi app được cấu hình Supabase.
- Lần đầu đăng nhập trên một máy còn dữ liệu IndexedDB: hỏi để **đưa dữ liệu cũ lên** tài khoản.
- Mỗi người chỉ đọc / ghi được dữ liệu của mình (RLS).

### Tiêu chí thành công

1. Tạo tài khoản bằng email, xác nhận email, đăng nhập, đăng xuất được; quên mật khẩu → nhận email → đặt mật khẩu mới được.
2. Đăng nhập bằng Google được (sau khi người dùng cấu hình Google trong dashboard theo hướng dẫn).
3. Mọi tính năng v1 (danh sách, Kanban kéo thả, báo cáo, nhãn, sao lưu, nhắc hạn) hoạt động với dữ liệu trên Supabase.
4. Hai tài khoản khác nhau không thấy dữ liệu của nhau, kể cả khi gọi thẳng REST API bằng publishable key.
5. Máy có dữ liệu IndexedDB cũ: lần đầu đăng nhập được hỏi một lần; chọn "Đưa lên" thì toàn bộ việc và nhãn xuất hiện trên tài khoản.
6. Không có `VITE_SUPABASE_URL` thì app chạy chế độ lưu trên máy như v1 (không đăng nhập); test đơn vị và e2e hiện có vẫn qua.

### Ngoài phạm vi

Đồng bộ realtime giữa thiết bị (chỉ tải lại khi quay lại tab), chia sẻ việc giữa nhiều người, offline-first (ghi khi mất mạng), đăng nhập bằng nhà cung cấp khác ngoài Google, đổi email / xoá tài khoản trong app.

## 2. Database (Postgres trên Supabase)

Tạo bằng migration có tên, lưu bản SQL trong `supabase/migrations/`.

### 2.1 Bảng `public.labels`

| Cột | Kiểu | Ràng buộc |
|---|---|---|
| `id` | `uuid` | khoá chính (app tạo bằng `crypto.randomUUID`) |
| `user_id` | `uuid` | `not null`, mặc định `auth.uid()`, tham chiếu `auth.users(id) on delete cascade` |
| `name` | `text` | `not null`, độ dài 1–30 |
| `color` | `text` | `not null`, thuộc 9 màu `slate, red, orange, amber, green, teal, blue, violet, pink` |
| `created_at` | `timestamptz` | `not null default now()` |

Chỉ mục duy nhất `(user_id, lower(name))`: tên nhãn không trùng (không phân biệt hoa thường) trong phạm vi một người.

### 2.2 Bảng `public.tasks`

| Cột | Kiểu | Ràng buộc |
|---|---|---|
| `id` | `uuid` | khoá chính |
| `user_id` | `uuid` | như `labels` |
| `title` | `text` | `not null`, độ dài 1–200 |
| `description` | `text` | `not null default ''` |
| `status` | `text` | `not null`, thuộc `todo, in_progress, done, on_hold` |
| `priority` | `text` | `not null`, thuộc `low, medium, high` |
| `due_at` | `timestamptz` | cho phép null |
| `label_ids` | `uuid[]` | `not null default '{}'` |
| `position` | `double precision` | `not null default 0` |
| `created_at`, `updated_at` | `timestamptz` | `not null` (app gửi lên, để hoàn tác / nhập giữ nguyên giá trị) |
| `completed_at` | `timestamptz` | cho phép null |

Chỉ mục `(user_id, status)`.

### 2.3 Bảo mật (RLS)

- Bật RLS trên cả hai bảng.
- Bốn policy cho mỗi bảng (`select`, `insert`, `update`, `delete`) cho vai trò `authenticated`, điều kiện `user_id = (select auth.uid())` (cả `using` và `with check`).
- Vai trò `anon` không có quyền gì trên hai bảng.

### 2.4 Hàm RPC (`security invoker`, chạy trong một giao dịch, tuân RLS)

- `remove_label(p_label_id uuid)`: `update tasks set label_ids = array_remove(label_ids, p_label_id)` cho mọi việc của người gọi có nhãn đó, đặt `updated_at = now()`, rồi xoá nhãn. Không có nhãn → lỗi `P0002` (map sang `NOT_FOUND`).
- `import_data(p_tasks jsonb, p_labels jsonb)`: upsert nhãn rồi upsert việc theo `id`. Việc gộp nhãn trùng tên (`planLabelImport` + `remapTaskLabels`, đã có) chạy phía client **trước** khi gọi, nên hàm chỉ ghi.
- `update_tasks(p_updates jsonb)`: nhận mảng việc đầy đủ đã áp patch phía client, upsert trong một giao dịch (dùng cho `updateMany` / kéo thả Kanban).

## 3. Ứng dụng

### 3.1 Chọn nơi lưu (`src/data/index.ts`)

- `getBackend()`: có `VITE_SUPABASE_URL` **và** `VITE_SUPABASE_PUBLISHABLE_KEY` → `'supabase'`, ngược lại `'local'`.
- `'local'`: giữ nguyên luồng v1 (`StorageGate` → Dexie, không đăng nhập).
- `'supabase'`: `AuthGate` → đăng nhập → `createSupabaseRepositories(client)`.
- Chỉ `src/data/supabase/` được import `@supabase/supabase-js` (giống quy tắc với `dexie`).

### 3.2 Repository Supabase (`src/data/supabase/`)

- `client.ts`: tạo một `SupabaseClient` duy nhất từ biến môi trường (`persistSession: true`, `detectSessionInUrl: true`, `flowType: 'pkce'`).
- `mappers.ts`: chuyển hàng DB (snake_case) ↔ `Task` / `Label` (camelCase). Thời điểm giữ dạng chuỗi ISO (`toISOString`).
- `errors.ts`: lỗi PostgREST → `RepositoryError`:
  - `23505` trên nhãn → `DUPLICATE_LABEL`
  - `23514` (check) trên tiêu đề / tên nhãn → `INVALID_TITLE` / `INVALID_LABEL_NAME`
  - Không có hàng nào được cập nhật / `P0002` → `NOT_FOUND`
  - Lỗi khác ném nguyên (UI đã hiển thị `SAVE_ERROR`).
- `SupabaseTaskRepository` / `SupabaseLabelRepository` cài đặt đúng interface hiện có (gồm `updateMany`, `restore`, `importData`). Kiểm tra / chuẩn hoá tên vẫn chạy phía client (`normalizeTitle`, `normalizeLabelName`) trước khi gửi; `position` đầu cột và `completedAt` tính phía client như Dexie (đọc việc cùng cột rồi `topPosition`).
- Đăng xuất → `queryClient.clear()`.

### 3.3 Đăng nhập (`src/features/auth/`)

- `AuthGate`: theo dõi phiên qua `onAuthStateChange`; đang kiểm tra → màn hình chờ; chưa đăng nhập → `LoginPage`; sự kiện `PASSWORD_RECOVERY` → `ResetPasswordPage`; đã đăng nhập → app.
- `LoginPage` (giao diện Zinc + xanh ngọc, bố cục chia đôi trên màn hình rộng, một cột trên điện thoại):
  - Tab **Đăng nhập** / **Tạo tài khoản**: email, mật khẩu (tối thiểu 8 ký tự khi tạo), nút gửi.
  - Tạo tài khoản xong: thông báo "Kiểm tra email để xác nhận tài khoản".
  - **Quên mật khẩu**: nhập email → `resetPasswordForEmail(email, { redirectTo: origin })` → thông báo đã gửi.
  - **Tiếp tục với Google**: `signInWithOAuth({ provider: 'google', options: { redirectTo: origin } })`.
  - Lỗi Supabase dịch sang tiếng Việt (sai mật khẩu, email chưa xác nhận, email đã tồn tại, quá nhiều lần thử, lỗi mạng).
- `ResetPasswordPage`: nhập mật khẩu mới hai lần → `updateUser({ password })` → vào app.
- Thanh bên (và trang Cài đặt trên điện thoại): ảnh đại diện Google hoặc chữ cái đầu email, email, nút **Đăng xuất**.

### 3.4 Đưa dữ liệu cũ lên (`src/features/auth/LocalImportPrompt.tsx`)

- Sau khi đăng nhập, mở IndexedDB cũ (chỉ đọc). Có việc hoặc nhãn **và** chưa có cờ `cvct.localImport.<userId>` → hộp thoại: "Tìm thấy N việc và M nhãn trên máy này. Đưa lên tài khoản?".
- **Đưa lên**: `planLabelImport` + `remapTaskLabels` với nhãn đang có trên tài khoản → `import_data` → toast "Đã đưa N việc lên tài khoản" → ghi cờ `'done'`.
- **Bỏ qua**: ghi cờ `'skipped'`, không hỏi lại.
- Dữ liệu IndexedDB giữ nguyên (bản dự phòng).

### 3.5 Mạng và bộ nhớ đệm

- Chế độ Supabase: `networkMode: 'online'` (tạm dừng khi mất mạng, chạy lại khi có mạng), `staleTime: 30s`, `refetchOnWindowFocus: true`, thử lại 2 lần cho truy vấn; thao tác ghi không tự thử lại.
- Dải "Đang ngoại tuyến — thay đổi sẽ không lưu được" khi `navigator.onLine === false`.
- Chế độ local giữ cấu hình hiện tại.
- Đồng bộ giữa các tab (BroadcastChannel) giữ nguyên ở cả hai chế độ.

### 3.6 Cấu hình người dùng tự làm trong dashboard

Viết thành `docs/supabase-setup.md`:

1. **Authentication → URL Configuration**: Site URL và Redirect URLs gồm `http://localhost:5173`, `http://localhost:4173` (và địa chỉ triển khai sau này).
2. **Google**: tạo OAuth Client (Web) trên Google Cloud Console, Authorized redirect URI `https://gagynghwjonksipejpfb.supabase.co/auth/v1/callback`; dán Client ID / Client Secret vào **Authentication → Sign In / Providers → Google**.
3. Tạo một tài khoản test (tuỳ chọn) để chạy bộ test hợp đồng với Supabase thật.

## 4. Kiểm thử

- **Đơn vị:** `mappers`, `errors`, `getBackend`, `LoginPage` (auth giả), `AuthGate`, `LocalImportPrompt`.
- **Hợp đồng repository với Supabase thật:** chạy `describeRepositoryContract` cho `createSupabaseRepositories` khi có `SUPABASE_TEST_EMAIL` / `SUPABASE_TEST_PASSWORD` trong `.env.test.local`; dọn dữ liệu của tài khoản test trước mỗi bài; không có biến thì `describe.skip`.
- **Bảo mật:** kiểm tra `get_advisors` (security) của Supabase sau migration không còn cảnh báo RLS.
- **Hiện có:** toàn bộ test đơn vị và e2e chạy ở chế độ local (Playwright build với biến Supabase rỗng).
