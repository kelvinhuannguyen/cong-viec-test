# Thiết lập Supabase cho "Công Việc Của Tôi"

Dự án Supabase: **`cong-viec-test`** (`https://gagynghwjonksipejpfb.supabase.co`).
Bảng `tasks`, `labels`, bảo mật theo dòng (RLS) và các hàm đã được tạo sẵn bằng migration
`supabase/migrations/20261017000000_init_tasks_labels.sql`. Bạn chỉ cần làm các bước trong dashboard dưới đây.

---

## Bước 1 — Biến môi trường (đã xong)

File `.env.local` ở thư mục gốc (không đưa lên GitHub):

```
VITE_SUPABASE_URL=https://gagynghwjonksipejpfb.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Chỉ dùng **Publishable key**. Không bao giờ dán **Secret key** / `service_role` vào đây.
Xoá hai dòng này (hoặc để trống) thì app quay về chế độ lưu trên máy, không cần đăng nhập.

Đổi `.env.local` xong phải **tắt và chạy lại** `npm run dev`.

---

## Bước 2 — Địa chỉ được phép quay lại sau khi đăng nhập

Dashboard → **Authentication** → **URL Configuration**:

1. **Site URL**: `http://localhost:5173` (sau này đổi thành địa chỉ thật khi đưa app lên mạng).
2. **Redirect URLs** → **Add URL**, thêm từng dòng:
   - `http://localhost:5173`
   - `http://localhost:5173/**`
   - `http://localhost:4173`
   - `http://localhost:4173/**`
3. Bấm **Save**.

Thiếu bước này thì link trong email xác nhận / đặt lại mật khẩu và đăng nhập Google sẽ đưa bạn về sai trang.

---

## Bước 3 — Đăng nhập bằng Email + mật khẩu

Dashboard → **Authentication** → **Sign In / Providers** → **Email**: đã **bật** sẵn.

- **Confirm email** đang bật: tạo tài khoản xong phải bấm link trong email rồi mới đăng nhập được.
- **Minimum password length**: đặt **8** cho khớp với app (mặc định của Supabase là 6).
  Mục này nằm ở **Authentication** → **Sign In / Providers** → **Email** (hoặc **Authentication** → **Policies / Passwords**).
- Email mặc định của Supabase chỉ gửi được vài thư mỗi giờ. Khi dùng thật nên cấu hình SMTP riêng
  (**Authentication** → **Emails** → **SMTP Settings**).

---

## Bước 4 — Đăng nhập bằng Google

### 4a. Tạo OAuth Client trên Google Cloud

1. Vào <https://console.cloud.google.com/> → tạo project mới (ví dụ `cong-viec-cua-toi`) hoặc chọn project có sẵn.
2. **APIs & Services** → **OAuth consent screen** (hoặc **Google Auth Platform** → **Branding**):
   - User type: **External** → điền **App name** `Công Việc Của Tôi`, **User support email**, **Developer contact email**.
   - **Audience**: khi còn ở chế độ *Testing*, thêm email của bạn vào **Test users**.
3. **APIs & Services** → **Credentials** → **Create credentials** → **OAuth client ID**:
   - Application type: **Web application**.
   - **Authorized JavaScript origins**: `http://localhost:5173` và `http://localhost:4173`.
   - **Authorized redirect URIs** — dán đúng dòng này:

     ```
     https://gagynghwjonksipejpfb.supabase.co/auth/v1/callback
     ```

   - Bấm **Create** → chép **Client ID** và **Client secret**.

### 4b. Bật Google trong Supabase

Dashboard → **Authentication** → **Sign In / Providers** → **Google**:

1. Bật **Enable Sign in with Google**.
2. Dán **Client ID** và **Client Secret** vừa chép.
3. Bấm **Save**.

Client Secret chỉ dán vào dashboard Supabase, **không** đưa vào `.env.local` hay mã nguồn.

---

## Bước 5 — Thử

1. `npm run dev` → mở <http://localhost:5173> → màn hình đăng nhập hiện ra.
2. **Tạo tài khoản** bằng email của bạn → mở email → bấm link xác nhận → quay lại app đăng nhập.
3. Nếu máy này đã có việc từ trước (chế độ lưu trên máy), app sẽ hỏi **"Đưa dữ liệu lên tài khoản"**.
4. Đăng xuất → bấm **Tiếp tục với Google** để thử đăng nhập Google.

---

## (Tuỳ chọn) Chạy bộ test hợp đồng với Supabase thật

Tạo một tài khoản riêng chỉ để test (dữ liệu của nó bị xoá sạch mỗi lần chạy), rồi tạo file `.env.test.local`:

```
SUPABASE_TEST_EMAIL=test@vidu.com
SUPABASE_TEST_PASSWORD=mat-khau-cua-tai-khoan-test
```

Rồi chạy `npm test`: 18 bài trong `src/data/supabase/supabase.contract.test.ts` sẽ chạy với database thật.
Không có file này thì các bài đó tự bỏ qua.
