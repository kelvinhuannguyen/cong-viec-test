# Thiết kế: "Công Việc Của Tôi" — phiên bản 1

- **Ngày:** 2026-10-16
- **Trạng thái:** Đã duyệt thiết kế, chờ duyệt spec
- **Loại:** Ứng dụng web quản lý công việc cá nhân, chạy trong trình duyệt, lưu dữ liệu local

## 1. Mục tiêu

Một ứng dụng quản lý công việc nhỏ gọn cho một người dùng, gồm:

- Danh sách công việc, xem dạng **Danh sách** hoặc **Kanban**.
- Cập nhật trạng thái: Cần làm, Đang làm, Đã xong, Tạm hoãn.
- Bộ lọc theo trạng thái, tìm kiếm theo tên, sắp xếp.
- Trang báo cáo đơn giản.
- Nhắc hạn chót bằng thông báo của trình duyệt.
- Cài được như ứng dụng (PWA) và chạy offline.

Phiên bản 1 **không** có đăng ký / đăng nhập. Dữ liệu lưu trong trình duyệt (IndexedDB). Các phiên bản sau sẽ chuyển lên **Supabase**; kiến trúc phiên bản 1 phải cho phép chuyển mà không viết lại giao diện.

### Tiêu chí thành công

1. Tạo, sửa, xoá (có hoàn tác) công việc với đủ các trường ở mục 3.
2. Đổi trạng thái bằng menu nhanh, ô tích "Đã xong", hoặc kéo thả trong Kanban.
3. Lọc theo trạng thái, tìm theo tên, sắp xếp — giữ nguyên sau khi tải lại trang.
4. Trang báo cáo hiển thị đúng số liệu theo định nghĩa ở mục 5.3.
5. Thông báo nhắc hạn chót hoạt động theo quy tắc ở mục 6 khi app đang mở.
6. Cài được thành PWA; khi mất mạng vẫn mở và dùng đầy đủ.
7. Thay `DexieTaskRepository` bằng một bản cài đặt khác không phải sửa component nào.

### Ngoài phạm vi phiên bản 1

Đăng nhập, đồng bộ đám mây, việc con, ước lượng thời gian, nhập bằng giọng nói (Web Speech), ngày lễ (Nager.Date), AI (Claude API), Telegram, Google Calendar, Web Push khi app đóng, xuất CSV/PDF, báo cáo theo nhãn/ưu tiên, lọc báo cáo theo khoảng thời gian, đa ngôn ngữ (chỉ tiếng Việt).

## 2. Công nghệ

| Mục đích | Lựa chọn |
|---|---|
| Khung giao diện | React + Vite + TypeScript |
| Giao diện | Tailwind CSS |
| Điều hướng | `react-router` |
| Dữ liệu bất đồng bộ / cache | `@tanstack/react-query` |
| Lưu trữ local | `dexie` (IndexedDB) |
| Kéo thả | `@dnd-kit` |
| Biểu đồ | `recharts` |
| Ngày giờ | `date-fns` (locale `vi`) |
| Kiểm tra dữ liệu | `zod` |
| PWA | `vite-plugin-pwa` |
| Kiểm thử | Vitest, React Testing Library, `fake-indexeddb`, Playwright |

Trạng thái giao diện (bộ lọc, tìm kiếm, sắp xếp) nằm trên URL; tuỳ chọn cá nhân (chế độ xem, giao diện sáng/tối, bật nhắc) nằm trong `localStorage`. Không dùng thư viện quản lý state toàn cục.

## 3. Kiến trúc

### 3.1 Cấu trúc thư mục

```
src/
├─ domain/          # Hàm thuần, không phụ thuộc React hay cơ sở dữ liệu
│   ├─ task.ts          Kiểu Task, TaskStatus, Priority, Label, NewTask
│   ├─ rules.ts         applyStatusChange, isOverdue, isDueSoon
│   ├─ stats.ts         Tính số liệu báo cáo
│   └─ reminders.ts     Quyết định việc nào cần nhắc
├─ data/            # Nơi duy nhất biết dữ liệu được lưu ở đâu
│   ├─ repository.ts    Interface TaskRepository, LabelRepository
│   ├─ dexie/           Bản cài đặt IndexedDB
│   ├─ backup.ts        Xuất / nhập JSON
│   └─ index.ts         Chọn bản cài đặt đang dùng
├─ hooks/           # Hook TanStack Query: useTasks, useCreateTask, useUpdateTask, ...
├─ features/
│   ├─ tasks/           Danh sách, Kanban, form, bộ lọc
│   ├─ report/          Trang báo cáo
│   └─ settings/        Nhãn, nhắc hạn, giao diện, sao lưu
├─ notifications/   # Lịch kiểm tra và gửi thông báo
└─ components/ui/   # Thành phần giao diện dùng chung
```

### 3.2 Luồng dữ liệu

```
Component → hook (TanStack Query) → TaskRepository (interface) → DexieTaskRepository → IndexedDB
```

Component không import Dexie. Khi lên Supabase: viết `SupabaseTaskRepository` cài đặt cùng interface, đổi lựa chọn trong `data/index.ts`.

### 3.3 Interface repository

```ts
interface TaskRepository {
  list(): Promise<Task[]>;
  create(input: NewTask): Promise<Task>;
  update(id: string, patch: TaskPatch): Promise<Task>;
  remove(id: string): Promise<void>;
  restore(task: Task): Promise<void>; // Phục vụ "Hoàn tác" sau khi xoá
}

interface LabelRepository {
  list(): Promise<Label[]>;
  create(input: NewLabel): Promise<Label>;
  update(id: string, patch: LabelPatch): Promise<Label>;
  remove(id: string): Promise<void>; // Đồng thời gỡ nhãn khỏi mọi Task
}
```

`TaskPatch` gồm các trường người dùng được sửa: `title`, `description`, `status`, `priority`, `dueAt`, `labelIds`, `position`. Repository tự đặt `updatedAt`, và áp dụng `applyStatusChange` để cập nhật `completedAt`.

## 4. Mô hình dữ liệu

```ts
type TaskStatus = 'todo' | 'in_progress' | 'done' | 'on_hold';
// Nhãn hiển thị:   Cần làm  Đang làm      Đã xong  Tạm hoãn
type Priority = 'low' | 'medium' | 'high';
// Nhãn hiển thị:  Thấp    Trung bình  Cao

interface Task {
  id: string;              // UUID (crypto.randomUUID)
  title: string;           // Bắt buộc, sau khi trim dài 1–200 ký tự
  description: string;     // Văn bản thường, mặc định ''
  status: TaskStatus;      // Mặc định 'todo'
  priority: Priority;      // Mặc định 'medium'
  dueAt: string | null;    // ISO 8601; chỉ chọn ngày → 23:59 giờ địa phương của ngày đó
  labelIds: string[];      // Mặc định []
  position: number;        // Thứ tự trong cột Kanban; việc mới đứng đầu cột
  createdAt: string;       // ISO 8601
  updatedAt: string;       // ISO 8601
  completedAt: string | null;
}

interface Label {
  id: string;              // UUID
  name: string;            // Bắt buộc, 1–30 ký tự, không trùng (không phân biệt hoa thường)
  color: string;           // Một trong bảng màu định sẵn
}
```

Bảng IndexedDB (Dexie, version 1):

- `tasks`: khoá `id`, chỉ mục `status`, `dueAt`, `createdAt`, `completedAt`
- `labels`: khoá `id`

Thay đổi cấu trúc về sau dùng `db.version(n).upgrade(...)` của Dexie.

## 5. Quy tắc nghiệp vụ

### 5.1 Trạng thái và thời điểm hoàn thành

- Đổi sang `done` từ trạng thái khác → `completedAt = now`.
- Đổi từ `done` sang trạng thái khác → `completedAt = null`.
- Đổi `done` → `done` → giữ nguyên `completedAt`.

### 5.2 Hạn chót

- **Trễ hạn:** `dueAt !== null`, `dueAt < now`, và `status !== 'done'`.
- **Sắp đến hạn:** `dueAt !== null`, `now ≤ dueAt ≤ now + 3 ngày`, và `status !== 'done'`.
- Việc ở trạng thái `on_hold` vẫn được tính trễ hạn / sắp đến hạn.

### 5.3 Số liệu báo cáo

- **Tổng:** số việc hiện có.
- **Theo trạng thái:** số việc của từng trạng thái.
- **Tỉ lệ hoàn thành:** `done / tổng`, làm tròn đến phần trăm nguyên; tổng = 0 thì hiển thị `0%`.
- **Hoàn thành theo ngày:** 7 ngày gần nhất tính cả hôm nay, đếm việc có `completedAt` rơi vào từng ngày (giờ địa phương).
- **Hoàn thành theo tuần:** 8 tuần gần nhất tính cả tuần này, tuần bắt đầu từ thứ Hai.
- **Danh sách trễ hạn:** sắp xếp `dueAt` tăng dần (trễ lâu nhất lên đầu).
- **Danh sách sắp đến hạn:** sắp xếp `dueAt` tăng dần.

### 5.4 Xoá

- Xoá việc: xoá thật khỏi IndexedDB, hiện thông báo kèm nút "Hoàn tác" trong 5 giây; bấm thì gọi `restore` với bản sao đã giữ.
- Xoá nhãn: có hộp xác nhận ghi số việc đang dùng nhãn; xác nhận thì gỡ nhãn khỏi các việc đó rồi xoá nhãn.

## 6. Màn hình

### 6.1 Điều hướng

Ba trang: **Công việc** (`/`), **Báo cáo** (`/bao-cao`), **Cài đặt** (`/cai-dat`). Màn hình rộng ≥ 768px dùng thanh bên trái; hẹp hơn dùng thanh tab ở đáy. Tiêu đề trang: "Công Việc Của Tôi".

### 6.2 Trang Công việc

- **Thanh trên:** ô tìm kiếm, nút chuyển Danh sách / Kanban, nút "+ Thêm" (phím tắt `N` khi không đang gõ trong ô nhập).
- **Thêm nhanh:** ô nhập ở đầu danh sách; Enter tạo việc với tên đã gõ và giá trị mặc định.
- **Hộp thoại tạo / sửa:** đủ các trường; chọn ngày hạn chót, giờ là tuỳ chọn.
- **Bộ lọc trạng thái:** chip "Tất cả" và bốn trạng thái, mỗi chip kèm số lượng (số lượng tính sau khi áp dụng tìm kiếm). Chọn một trạng thái tại một thời điểm.
- **Tìm kiếm:** khớp chuỗi con trong `title`, không phân biệt hoa thường và không phân biệt dấu tiếng Việt.
- **Sắp xếp (chỉ chế độ Danh sách):**
  - Hạn chót: tăng dần, việc không có hạn xếp cuối. Đây là mặc định.
  - Ưu tiên: Cao → Thấp, cùng mức thì theo hạn chót.
  - Ngày tạo: mới nhất trước.
- **Dòng trong danh sách:**
  - Ô tích: tích thì chuyển sang `done`, bỏ tích thì trả về `todo`.
  - Tên việc, chip nhãn, huy hiệu ưu tiên.
  - Hạn chót dạng tương đối ("Hôm qua", "Còn 2 ngày"): đỏ nếu trễ, cam nếu sắp đến hạn.
  - Menu chọn trạng thái, menu ⋯ (Sửa, Xoá). Bấm tên việc để mở hộp thoại sửa.
- **Kanban:**
  - 4 cột theo thứ tự Cần làm, Đang làm, Tạm hoãn, Đã xong.
  - Kéo sang cột khác để đổi trạng thái; kéo trong cột để đổi `position`.
  - Bộ lọc trạng thái ẩn các cột không được chọn. Tìm kiếm lọc thẻ trong mọi cột.
- **URL:** `?status=<trạng thái>&q=<từ khoá>&sort=<due|priority|created>`. Chế độ xem lưu trong `localStorage`.
- **Trạng thái trống:** chưa có việc → lời mời "Thêm việc đầu tiên"; lọc không ra kết quả → nút "Xoá bộ lọc".

### 6.3 Trang Báo cáo

- Bốn thẻ: Tổng, Đang làm, Đã xong, Tỉ lệ hoàn thành.
- Biểu đồ tròn phân bổ theo trạng thái.
- Biểu đồ cột hoàn thành, chuyển được giữa "7 ngày" và "8 tuần".
- Hai danh sách: Trễ hạn, Sắp đến hạn. Bấm một việc thì mở hộp thoại sửa việc đó.

### 6.4 Trang Cài đặt

- Quản lý nhãn: thêm, đổi tên, đổi màu, xoá.
- Công tắc "Nhắc hạn chót" (mục 7).
- Giao diện: Sáng / Tối / Theo hệ thống (mặc định).
- Sao lưu: "Xuất dữ liệu" (tải file JSON), "Nhập dữ liệu" (mục 8.3).

## 7. Nhắc hạn chót (Notifications API)

Giới hạn: không có server nên chỉ nhắc được **khi app đang mở** (tab hoặc PWA đang chạy). Nhắc khi app đã đóng thuộc giai đoạn Supabase (Web Push).

- Mặc định tắt. Bật công tắc thì gọi `Notification.requestPermission()`.
- **Tóm tắt trong ngày:** lần đầu app mở trong một ngày (theo giờ địa phương), nếu có việc đến hạn hôm nay hoặc trễ hạn → một thông báo dạng "Hôm nay có X việc đến hạn, Y việc đang trễ".
- **Kiểm tra định kỳ:** mỗi 60 giây khi app mở, với mọi việc chưa `done` có `dueAt`:
  - Còn ≤ 1 giờ đến hạn và chưa nhắc loại này → nhắc "Sắp đến hạn".
  - Quá hạn không quá 24 giờ và chưa nhắc loại này → nhắc "Đã trễ hạn". Việc trễ lâu hơn chỉ xuất hiện trong bản tóm tắt trong ngày, để tránh dồn hàng loạt thông báo khi mở app sau nhiều ngày.
- **Chống nhắc trùng:** lưu khoá `${taskId}:${dueAt}:${loại}` trong `localStorage`. Đổi `dueAt` thì khoá mới, nên sẽ được nhắc lại. Khoá của việc đã xoá hoặc đã xong được dọn mỗi lần mở app.
- **Bấm thông báo:** đưa cửa sổ app lên trước và mở hộp thoại của việc đó.
- **Quyền bị từ chối hoặc không hỗ trợ:** công tắc hiện giải thích; thay bằng dải cảnh báo trong app ở đầu trang Công việc khi có việc trễ hạn.
- Logic chọn việc cần nhắc nằm trong `domain/reminders.ts` (hàm thuần nhận danh sách việc, thời điểm hiện tại và tập khoá đã nhắc), để kiểm thử được.

## 8. PWA, độ bền dữ liệu và xử lý lỗi

### 8.1 PWA

- `vite-plugin-pwa`, chế độ `prompt`. Manifest gồm `name`: "Công Việc Của Tôi", `short_name`: "Công Việc", icon 192/512 và maskable, `display: standalone`.
- Service worker precache toàn bộ app shell; app chạy hoàn toàn offline.
- Có bản mới → thông báo "Có phiên bản mới — Tải lại"; không tự tải lại.

### 8.2 Độ bền dữ liệu

- Khởi động: gọi `navigator.storage.persist()`. Cài đặt hiển thị dữ liệu có được bảo vệ khỏi việc tự xoá hay không.
- Cài đặt nhắc người dùng xuất file sao lưu định kỳ.

### 8.3 Xuất / nhập JSON

- Định dạng: `{ "app": "cong-viec-cua-toi", "version": 1, "exportedAt": "...", "tasks": [...], "labels": [...] }`.
- Nhập:
  1. Kiểm tra toàn bộ file bằng zod. Sai → báo lỗi, không ghi gì.
  2. Đúng → hộp xác nhận ghi số việc / nhãn sẽ thêm mới và số sẽ ghi đè.
  3. Xác nhận → gộp theo `id` (trùng thì ghi đè) trong một transaction Dexie.

### 8.4 Xử lý lỗi

- **Form:** zod; lỗi hiện dưới ô nhập; không cho lưu khi còn lỗi.
- **Đổi trạng thái, kéo thả, tích ô:** cập nhật lạc quan qua TanStack Query; thất bại thì khôi phục và báo "Không lưu được, thử lại".
- **Tạo / sửa / xoá thất bại:** thông báo lỗi; hộp thoại giữ nguyên nội dung đã nhập.
- **IndexedDB không dùng được:** màn hình toàn trang giải thích lý do và gợi ý thoát chế độ ẩn danh.
- **Lỗi không lường trước trong giao diện:** Error Boundary hiện "Đã có lỗi" kèm nút tải lại.

## 9. Kiểm thử

- **Vitest, viết test trước (TDD)** cho `domain/`: `applyStatusChange`, `isOverdue`, `isDueSoon`, `stats`, `reminders`, tìm kiếm không dấu, các kiểu sắp xếp.
- **Bộ test hợp đồng repository:** một bộ test viết theo `TaskRepository` / `LabelRepository`, nhận vào một hàm tạo repository. Phiên bản 1 chạy với Dexie + `fake-indexeddb`; giai đoạn Supabase chạy lại cùng bộ test.
- **Sao lưu:** xuất rồi nhập lại cho ra dữ liệu giống hệt; file sai không làm thay đổi dữ liệu.
- **React Testing Library:** thêm nhanh, tạo qua hộp thoại, đổi trạng thái, lọc, tìm kiếm, xoá + hoàn tác.
- **Playwright (smoke):**
  1. Thêm việc → chuyển sang Đã xong → trang Báo cáo hiện tỉ lệ hoàn thành đúng.
  2. Tải lại trang → dữ liệu và bộ lọc trên URL còn nguyên.

## 10. Lộ trình sau phiên bản 1 (tham khảo, không làm trong phiên bản này)

1. **Supabase:** Auth, Postgres với `SupabaseTaskRepository`, nhập dữ liệu từ file JSON của phiên bản 1, Realtime.
2. **Supabase Edge Functions** giữ key bí mật cho: Claude API (tạo việc từ câu tự nhiên, chia nhỏ việc, nhận xét báo cáo), Telegram Bot (nhắc việc, tóm tắt buổi sáng), Web Push.
3. Web Speech API (nhập bằng giọng nói), Nager.Date (ngày lễ Việt Nam), Google Calendar.
