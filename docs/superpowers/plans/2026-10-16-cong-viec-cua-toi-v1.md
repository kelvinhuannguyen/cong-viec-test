# Công Việc Của Tôi v1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây ứng dụng web quản lý công việc cá nhân "Công Việc Của Tôi": danh sách + Kanban, 4 trạng thái, lọc / tìm / sắp xếp, trang báo cáo, nhắc hạn chót bằng Notifications API, cài được như PWA và chạy offline. Dữ liệu lưu trong IndexedDB.

**Architecture:** Luồng một chiều `component → hook TanStack Query → Repository interface → DexieRepository → IndexedDB`. Toàn bộ quy tắc nghiệp vụ là hàm thuần trong `src/domain/`, viết theo TDD. Chỉ `src/data/dexie/` được import Dexie, để sau này thay bằng Supabase mà không phải sửa giao diện.

**Tech Stack:** React 19, Vite 7, TypeScript 5.9, Tailwind CSS 4, react-router 7, @tanstack/react-query 5, Dexie 4, @dnd-kit, Recharts 3, date-fns 4, zod 4, vite-plugin-pwa 1, Vitest 3 + React Testing Library + fake-indexeddb, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-16-cong-viec-cua-toi-design.md`

## Global Constraints

- Tên ứng dụng: **"Công Việc Của Tôi"**; `short_name` của PWA: **"Công Việc"**.
- Toàn bộ chữ trên giao diện là **tiếng Việt**.
- Mã trạng thái và nhãn hiển thị: `todo` = "Cần làm", `in_progress` = "Đang làm", `done` = "Đã xong", `on_hold` = "Tạm hoãn".
- Mã ưu tiên và nhãn: `low` = "Thấp", `medium` = "Trung bình", `high` = "Cao".
- Thứ tự cột Kanban: Cần làm, Đang làm, Tạm hoãn, Đã xong.
- Tên việc dài 1–200 ký tự sau khi trim. Tên nhãn dài 1–30 ký tự, không trùng (không phân biệt hoa thường).
- Mọi thời điểm lưu dạng chuỗi ISO 8601 (`Date#toISOString()`). Hạn chót chỉ có ngày → 23:59 giờ địa phương của ngày đó.
- "Sắp đến hạn" = trong 3 ngày tới. Nhắc "Sắp đến hạn" khi còn ≤ 1 giờ. Nhắc "Đã trễ hạn" khi quá hạn ≤ 24 giờ. Hoàn tác xoá trong 5 giây.
- Chỉ các file trong `src/data/dexie/` được import `dexie`.
- Không dùng thư viện quản lý state toàn cục. Trạng thái lọc nằm trên URL; tuỳ chọn cá nhân nằm trong `localStorage`, khoá có tiền tố `cvct.`.
- TanStack Query phải dùng `networkMode: 'always'` (app chạy offline).
- Node.js ≥ 20. Chạy lệnh trên Windows bằng Git Bash hoặc PowerShell đều được; các lệnh dưới đây chạy được ở cả hai.
- Mỗi commit kết thúc bằng dòng `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` (truyền bằng `-m` thứ hai).
- Trước Task 1: chạy `git config user.email`. Nếu trống, **dừng lại và hỏi người dùng** tên + email để cấu hình. Không tự đặt.

## File Map

```
index.html, vite.config.ts, tsconfig.json, package.json, .gitignore
pwa-assets.config.ts, playwright.config.ts
public/favicon.svg (+ icon PNG sinh tự động ở Task 17)
e2e/smoke.spec.ts
src/
  main.tsx, App.tsx, index.css, vite-env.d.ts
  app/        AppProviders.tsx, AppRoutes.tsx, Layout.tsx, ErrorBoundary.tsx, StorageGate.tsx, queryClient.ts
  domain/     task.ts, rules.ts, query.ts, kanban.ts, stats.ts, reminders.ts (+ *.test.ts)
  data/       repository.ts, repositoryContract.ts, backup.ts, probe.ts, index.ts
  data/dexie/ db.ts, DexieTaskRepository.ts, DexieLabelRepository.ts, createDexieRepositories.ts, dexie.test.ts
  hooks/      RepositoryContext.tsx, queryKeys.ts, useTasks.ts, useLabels.ts, useImportData.ts, hooks.test.tsx
  lib/        id.ts, object.ts, prefs.ts, theme.ts, format.ts, useNow.ts, keyboard.ts, labelColors.ts, errors.ts
  components/ui/ styles.ts, Toast.tsx, Dialog.tsx
  features/tasks/    TasksPage.tsx, QuickAdd.tsx, TaskForm.tsx, taskForm.ts, TaskDialogHost.tsx,
                     useTaskDialogParam.ts, useTaskUrlState.ts, StatusFilterBar.tsx, TaskRow.tsx,
                     badges.tsx, EmptyState.tsx, KanbanBoard.tsx
  features/report/   ReportPage.tsx
  features/settings/ SettingsPage.tsx, LabelManager.tsx, ThemeSection.tsx, BackupSection.tsx,
                     StorageStatus.tsx, ReminderSection.tsx
  notifications/     notifier.ts, tick.ts, useReminderSettings.ts, ReminderRunner.tsx, ReminderBanner.tsx
  pwa/               UpdatePrompt.tsx
  test/              setup.ts, factories.ts, render.tsx, pwaRegisterMock.ts
```

---

### Task 1: Khởi tạo dự án và bộ công cụ

**Files:**
- Create: `package.json`, `.gitignore`, `index.html`, `vite.config.ts`, `tsconfig.json`, `public/favicon.svg`
- Create: `src/main.tsx`, `src/App.tsx`, `src/index.css`, `src/vite-env.d.ts`
- Create: `src/test/setup.ts`, `src/test/pwaRegisterMock.ts`
- Test: `src/App.test.tsx`

**Interfaces:**
- Consumes: không có
- Produces: lệnh `npm test`, `npm run build`, `npm run typecheck`; môi trường test jsdom có sẵn `fake-indexeddb`, `jest-dom`, polyfill `ResizeObserver` / `matchMedia` / `crypto.randomUUID`; alias `virtual:pwa-register/react` → `src/test/pwaRegisterMock.ts` khi chạy test.

- [ ] **Step 1: Kiểm tra danh tính git**

Run: `git config user.email`
Expected: in ra một email. Nếu trống → dừng và hỏi người dùng (xem Global Constraints).

Thư mục đã là git repo (có `docs/`). Nếu `git status` cho thấy `docs/` chưa được commit, commit nó trong Step 9.

- [ ] **Step 2: Tạo `package.json`**

```json
{
  "name": "cong-viec-cua-toi",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "engines": { "node": ">=20" },
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "typecheck": "tsc",
    "test": "vitest run",
    "test:watch": "vitest",
    "e2e": "playwright test",
    "icons": "pwa-assets-generator"
  }
}
```

- [ ] **Step 3: Cài thư viện**

Run:
```bash
npm install react@^19 react-dom@^19 react-router@^7 @tanstack/react-query@^5 dexie@^4 @dnd-kit/core@^6 @dnd-kit/sortable@^10 @dnd-kit/utilities@^3 recharts@^3 date-fns@^4 zod@^4
```
```bash
npm install -D vite@^7 @vitejs/plugin-react@^5 typescript@~5.9 @types/react@^19 @types/react-dom@^19 @types/node@^22 tailwindcss@^4 @tailwindcss/vite@^4 vitest@^3 jsdom@^26 @testing-library/react@^16 @testing-library/dom@^10 @testing-library/user-event@^14 @testing-library/jest-dom@^6 fake-indexeddb@^6 vite-plugin-pwa@^1 workbox-window@^7 @vite-pwa/assets-generator@^1 @playwright/test@^1
```
Expected: cài xong, không có lỗi peer dependency nghiêm trọng (cảnh báo thì chấp nhận được).

- [ ] **Step 4: Tạo file cấu hình**

`.gitignore`:
```
node_modules
dist
dev-dist
coverage
test-results
playwright-report
*.local
```

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "resolveJsonModule": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src", "e2e", "vite.config.ts", "playwright.config.ts", "pwa-assets.config.ts"]
}
```

`vite.config.ts`:
```ts
/// <reference types="vitest/config" />
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    alias: {
      'virtual:pwa-register/react': fileURLToPath(
        new URL('./src/test/pwaRegisterMock.ts', import.meta.url),
      ),
    },
  },
});
```

`index.html`:
```html
<!doctype html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <meta name="theme-color" content="#2563eb" />
    <title>Công Việc Của Tôi</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`public/favicon.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="#2563eb"/><path d="M150 266l70 70 142-160" fill="none" stroke="#fff" stroke-width="48" stroke-linecap="round" stroke-linejoin="round"/></svg>
```

- [ ] **Step 5: Tạo mã nguồn khởi đầu**

`src/vite-env.d.ts`:
```ts
/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />
```

`src/index.css`:
```css
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));

:root {
  color-scheme: light;
}
:root.dark {
  color-scheme: dark;
}
body {
  @apply bg-slate-50 text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100;
}
```

`src/App.tsx`:
```tsx
export function App() {
  return <h1 className="p-8 text-2xl font-bold">Công Việc Của Tôi</h1>;
}
```

`src/main.tsx`:
```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

`src/test/pwaRegisterMock.ts` (thay cho module ảo của vite-plugin-pwa khi chạy test):
```ts
export function useRegisterSW() {
  return {
    needRefresh: [false, () => {}] as [boolean, (value: boolean) => void],
    offlineReady: [false, () => {}] as [boolean, (value: boolean) => void],
    updateServiceWorker: async (_reload?: boolean) => {},
  };
}
```

`src/test/setup.ts`:
```ts
import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';
import { randomUUID } from 'node:crypto';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

if (typeof globalThis.crypto.randomUUID !== 'function') {
  Object.defineProperty(globalThis.crypto, 'randomUUID', { value: randomUUID });
}

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;

if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

afterEach(() => {
  cleanup();
  localStorage.clear();
  document.documentElement.classList.remove('dark');
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
```

- [ ] **Step 6: Viết test khói**

`src/App.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { App } from './App';

it('hiển thị tên ứng dụng', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: 'Công Việc Của Tôi' })).toBeInTheDocument();
});
```

- [ ] **Step 7: Chạy test**

Run: `npm test`
Expected: PASS, 1 test.

- [ ] **Step 8: Kiểm tra build**

Run: `npm run build`
Expected: `tsc` không lỗi, Vite tạo `dist/`.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "chore: khởi tạo dự án React + Vite + Tailwind + Vitest" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Kiểu dữ liệu và quy tắc nghiệp vụ cốt lõi

**Files:**
- Create: `src/domain/task.ts`, `src/domain/rules.ts`, `src/test/factories.ts`
- Test: `src/domain/rules.test.ts`

**Interfaces:**
- Consumes: không có
- Produces:
  - `task.ts`: `TASK_STATUSES`, `TaskStatus`, `PRIORITIES`, `Priority`, `LABEL_COLORS`, `LabelColor`, `STATUS_LABELS`, `PRIORITY_LABELS`, `KANBAN_COLUMNS`, `Task`, `Label`, `NewTask`, `TaskInput`, `TaskPatch`, `TaskUpdate`, `NewLabel`, `LabelPatch`
  - `rules.ts`: `DUE_SOON_MS`, `TITLE_MAX`, `LABEL_NAME_MAX`, `applyStatusChange(task, next, now)`, `isOverdue(task, now)`, `isDueSoon(task, now)`, `normalizeTitle(title): string | null`, `normalizeLabelName(name): string | null`, `sameLabelName(a, b): boolean`, `toDueAt(date, time): string | null`, `fromDueAt(dueAt): { date; time }`
  - `factories.ts`: `makeTask(overrides?)`, `makeLabel(overrides?)`

- [ ] **Step 1: Tạo `src/domain/task.ts`**

```ts
export const TASK_STATUSES = ['todo', 'in_progress', 'done', 'on_hold'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const PRIORITIES = ['low', 'medium', 'high'] as const;
export type Priority = (typeof PRIORITIES)[number];

export const LABEL_COLORS = [
  'slate', 'red', 'orange', 'amber', 'green', 'teal', 'blue', 'violet', 'pink',
] as const;
export type LabelColor = (typeof LABEL_COLORS)[number];

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'Cần làm',
  in_progress: 'Đang làm',
  done: 'Đã xong',
  on_hold: 'Tạm hoãn',
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: 'Thấp',
  medium: 'Trung bình',
  high: 'Cao',
};

export const KANBAN_COLUMNS: TaskStatus[] = ['todo', 'in_progress', 'on_hold', 'done'];

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  dueAt: string | null;
  labelIds: string[];
  position: number;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface Label {
  id: string;
  name: string;
  color: LabelColor;
}

export interface NewTask {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: Priority;
  dueAt?: string | null;
  labelIds?: string[];
}

/** Dữ liệu đầy đủ từ form tạo / sửa: dùng được cho cả create và update. */
export type TaskInput = Required<NewTask>;

export type TaskPatch = Partial<
  Pick<Task, 'title' | 'description' | 'status' | 'priority' | 'dueAt' | 'labelIds' | 'position'>
>;

export interface TaskUpdate {
  id: string;
  patch: TaskPatch;
}

export interface NewLabel {
  name: string;
  color: LabelColor;
}

export type LabelPatch = Partial<NewLabel>;
```

- [ ] **Step 2: Tạo `src/test/factories.ts`**

```ts
import type { Label, Task } from '../domain/task';

let seq = 0;

export function makeTask(overrides: Partial<Task> = {}): Task {
  seq += 1;
  const ts = new Date(2026, 9, 1, 8, 0).toISOString();
  return {
    id: `t${seq}`,
    title: `Việc ${seq}`,
    description: '',
    status: 'todo',
    priority: 'medium',
    dueAt: null,
    labelIds: [],
    position: 0,
    createdAt: ts,
    updatedAt: ts,
    completedAt: null,
    ...overrides,
  };
}

export function makeLabel(overrides: Partial<Label> = {}): Label {
  seq += 1;
  return { id: `l${seq}`, name: `Nhãn ${seq}`, color: 'blue', ...overrides };
}
```

- [ ] **Step 3: Viết test thất bại**

`src/domain/rules.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { makeTask } from '../test/factories';
import {
  applyStatusChange,
  fromDueAt,
  isDueSoon,
  isOverdue,
  normalizeLabelName,
  normalizeTitle,
  sameLabelName,
  toDueAt,
} from './rules';

const now = new Date(2026, 9, 16, 10, 0);
const iso = (d: Date) => d.toISOString();
const hoursFromNow = (h: number) => iso(new Date(now.getTime() + h * 3_600_000));

describe('applyStatusChange', () => {
  it('chuyển sang Đã xong thì ghi completedAt', () => {
    expect(applyStatusChange({ status: 'todo', completedAt: null }, 'done', now)).toEqual({
      status: 'done',
      completedAt: iso(now),
    });
  });
  it('rời khỏi Đã xong thì xoá completedAt', () => {
    expect(applyStatusChange({ status: 'done', completedAt: iso(now) }, 'todo', now)).toEqual({
      status: 'todo',
      completedAt: null,
    });
  });
  it('Đã xong sang Đã xong thì giữ completedAt cũ', () => {
    const old = iso(new Date(2026, 9, 1));
    expect(applyStatusChange({ status: 'done', completedAt: old }, 'done', now)).toEqual({
      status: 'done',
      completedAt: old,
    });
  });
  it('đổi giữa các trạng thái chưa xong thì completedAt là null', () => {
    expect(applyStatusChange({ status: 'in_progress', completedAt: null }, 'on_hold', now)).toEqual({
      status: 'on_hold',
      completedAt: null,
    });
  });
});

describe('isOverdue', () => {
  it('quá hạn và chưa xong', () => {
    expect(isOverdue(makeTask({ dueAt: hoursFromNow(-1) }), now)).toBe(true);
  });
  it('đã xong thì không trễ', () => {
    expect(isOverdue(makeTask({ dueAt: hoursFromNow(-1), status: 'done' }), now)).toBe(false);
  });
  it('không có hạn thì không trễ', () => {
    expect(isOverdue(makeTask({ dueAt: null }), now)).toBe(false);
  });
  it('hạn ở tương lai thì không trễ', () => {
    expect(isOverdue(makeTask({ dueAt: hoursFromNow(1) }), now)).toBe(false);
  });
  it('Tạm hoãn vẫn tính trễ', () => {
    expect(isOverdue(makeTask({ dueAt: hoursFromNow(-1), status: 'on_hold' }), now)).toBe(true);
  });
});

describe('isDueSoon', () => {
  it('trong 3 ngày tới', () => {
    expect(isDueSoon(makeTask({ dueAt: hoursFromNow(48) }), now)).toBe(true);
  });
  it('đúng thời điểm hiện tại vẫn tính', () => {
    expect(isDueSoon(makeTask({ dueAt: iso(now) }), now)).toBe(true);
  });
  it('xa hơn 3 ngày thì không', () => {
    expect(isDueSoon(makeTask({ dueAt: hoursFromNow(96) }), now)).toBe(false);
  });
  it('đã quá hạn thì không', () => {
    expect(isDueSoon(makeTask({ dueAt: hoursFromNow(-1) }), now)).toBe(false);
  });
  it('đã xong thì không', () => {
    expect(isDueSoon(makeTask({ dueAt: hoursFromNow(5), status: 'done' }), now)).toBe(false);
  });
});

describe('normalizeTitle / normalizeLabelName', () => {
  it('cắt khoảng trắng hai đầu', () => {
    expect(normalizeTitle('  Viết báo cáo  ')).toBe('Viết báo cáo');
  });
  it('rỗng thì null', () => {
    expect(normalizeTitle('   ')).toBeNull();
  });
  it('200 ký tự được, 201 thì null', () => {
    expect(normalizeTitle('a'.repeat(200))).toBe('a'.repeat(200));
    expect(normalizeTitle('a'.repeat(201))).toBeNull();
  });
  it('tên nhãn tối đa 30 ký tự', () => {
    expect(normalizeLabelName('a'.repeat(30))).toBe('a'.repeat(30));
    expect(normalizeLabelName('a'.repeat(31))).toBeNull();
  });
  it('so tên nhãn không phân biệt hoa thường', () => {
    expect(sameLabelName('Công việc', '  CÔNG VIỆC ')).toBe(true);
    expect(sameLabelName('Công việc', 'Cá nhân')).toBe(false);
  });
});

describe('toDueAt / fromDueAt', () => {
  it('chỉ có ngày thì đặt 23:59 giờ địa phương', () => {
    expect(toDueAt('2026-10-20', '')).toBe(new Date(2026, 9, 20, 23, 59).toISOString());
  });
  it('có giờ thì dùng giờ đó', () => {
    expect(toDueAt('2026-10-20', '09:30')).toBe(new Date(2026, 9, 20, 9, 30).toISOString());
  });
  it('không có ngày thì null', () => {
    expect(toDueAt('', '09:30')).toBeNull();
  });
  it('fromDueAt đảo ngược toDueAt; 23:59 hiển thị giờ trống', () => {
    expect(fromDueAt(toDueAt('2026-10-20', ''))).toEqual({ date: '2026-10-20', time: '' });
    expect(fromDueAt(toDueAt('2026-01-05', '07:05'))).toEqual({ date: '2026-01-05', time: '07:05' });
    expect(fromDueAt(null)).toEqual({ date: '', time: '' });
  });
});
```

- [ ] **Step 4: Chạy để thấy thất bại**

Run: `npx vitest run src/domain/rules.test.ts`
Expected: FAIL — không tìm thấy module `./rules`.

- [ ] **Step 5: Viết `src/domain/rules.ts`**

```ts
import type { Task, TaskStatus } from './task';

export const DUE_SOON_MS = 3 * 24 * 60 * 60 * 1000;
export const TITLE_MAX = 200;
export const LABEL_NAME_MAX = 30;

export function applyStatusChange(
  task: Pick<Task, 'status' | 'completedAt'>,
  next: TaskStatus,
  now: Date,
): Pick<Task, 'status' | 'completedAt'> {
  if (next !== 'done') return { status: next, completedAt: null };
  if (task.status === 'done') return { status: next, completedAt: task.completedAt };
  return { status: next, completedAt: now.toISOString() };
}

type DueFields = Pick<Task, 'status' | 'dueAt'>;

export function isOverdue(task: DueFields, now: Date): boolean {
  if (task.status === 'done' || task.dueAt === null) return false;
  return Date.parse(task.dueAt) < now.getTime();
}

export function isDueSoon(task: DueFields, now: Date): boolean {
  if (task.status === 'done' || task.dueAt === null) return false;
  const due = Date.parse(task.dueAt);
  return due >= now.getTime() && due <= now.getTime() + DUE_SOON_MS;
}

function normalizeText(value: string, max: number): string | null {
  const trimmed = value.trim();
  return trimmed.length >= 1 && trimmed.length <= max ? trimmed : null;
}

export function normalizeTitle(title: string): string | null {
  return normalizeText(title, TITLE_MAX);
}

export function normalizeLabelName(name: string): string | null {
  return normalizeText(name, LABEL_NAME_MAX);
}

export function sameLabelName(a: string, b: string): boolean {
  return a.trim().toLocaleLowerCase('vi') === b.trim().toLocaleLowerCase('vi');
}

const pad = (n: number) => String(n).padStart(2, '0');

/** `date` dạng yyyy-MM-dd, `time` dạng HH:mm hoặc rỗng (→ 23:59). */
export function toDueAt(date: string, time: string): string | null {
  if (!date) return null;
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = time ? time.split(':').map(Number) : [23, 59];
  return new Date(y, m - 1, d, hh, mm, 0, 0).toISOString();
}

export function fromDueAt(dueAt: string | null): { date: string; time: string } {
  if (!dueAt) return { date: '', time: '' };
  const d = new Date(dueAt);
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const isEndOfDay = d.getHours() === 23 && d.getMinutes() === 59;
  return { date, time: isEndOfDay ? '' : `${pad(d.getHours())}:${pad(d.getMinutes())}` };
}
```

- [ ] **Step 6: Chạy test**

Run: `npx vitest run src/domain/rules.test.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/domain src/test/factories.ts
git commit -m "feat(domain): kiểu dữ liệu Task/Label và quy tắc trạng thái, hạn chót" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Tìm kiếm, lọc, đếm và sắp xếp

**Files:**
- Create: `src/domain/query.ts`
- Test: `src/domain/query.test.ts`

**Interfaces:**
- Consumes: `Task`, `TaskStatus`, `Priority`, `TASK_STATUSES` từ `task.ts`
- Produces: `StatusFilter = TaskStatus | 'all'`, `SORT_KEYS`, `SortKey = 'due' | 'priority' | 'created'`, `normalizeText(text)`, `searchTasks(tasks, query)`, `filterByStatus(tasks, status)`, `countByStatus(tasks): Record<StatusFilter, number>`, `sortTasks(tasks, key)`, `parseStatusFilter(value: string | null): StatusFilter`, `parseSortKey(value: string | null): SortKey`

- [ ] **Step 1: Viết test thất bại**

`src/domain/query.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { makeTask } from '../test/factories';
import {
  countByStatus,
  filterByStatus,
  normalizeText,
  parseSortKey,
  parseStatusFilter,
  searchTasks,
  sortTasks,
} from './query';

const at = (day: number, hour = 9) => new Date(2026, 9, day, hour).toISOString();

describe('normalizeText', () => {
  it('bỏ dấu tiếng Việt, kể cả đ/Đ, và chữ hoa', () => {
    expect(normalizeText('  Đọc BÁO cáo  ')).toBe('doc bao cao');
  });
});

describe('searchTasks', () => {
  const tasks = [makeTask({ title: 'Viết báo cáo quý' }), makeTask({ title: 'Mua sữa' })];
  it('khớp chuỗi con không dấu, không phân biệt hoa thường', () => {
    expect(searchTasks(tasks, 'BAO cao').map((t) => t.title)).toEqual(['Viết báo cáo quý']);
    expect(searchTasks(tasks, 'sữa').map((t) => t.title)).toEqual(['Mua sữa']);
  });
  it('từ khoá rỗng trả về tất cả', () => {
    expect(searchTasks(tasks, '   ')).toHaveLength(2);
  });
});

describe('filterByStatus / countByStatus', () => {
  const tasks = [
    makeTask({ status: 'todo' }),
    makeTask({ status: 'todo' }),
    makeTask({ status: 'in_progress' }),
    makeTask({ status: 'done' }),
  ];
  it('lọc theo trạng thái; all trả về tất cả', () => {
    expect(filterByStatus(tasks, 'todo')).toHaveLength(2);
    expect(filterByStatus(tasks, 'all')).toHaveLength(4);
  });
  it('đếm theo từng trạng thái', () => {
    expect(countByStatus(tasks)).toEqual({ all: 4, todo: 2, in_progress: 1, done: 1, on_hold: 0 });
  });
});

describe('sortTasks', () => {
  const a = makeTask({ title: 'A', dueAt: at(20), priority: 'low', createdAt: at(1) });
  const b = makeTask({ title: 'B', dueAt: null, priority: 'high', createdAt: at(3) });
  const c = makeTask({ title: 'C', dueAt: at(18), priority: 'high', createdAt: at(2) });
  const d = makeTask({ title: 'D', dueAt: null, priority: 'medium', createdAt: at(4) });
  const titles = (list: { title: string }[]) => list.map((t) => t.title);

  it('due: hạn sớm trước, không có hạn xếp cuối (mới tạo trước)', () => {
    expect(titles(sortTasks([a, b, c, d], 'due'))).toEqual(['C', 'A', 'D', 'B']);
  });
  it('priority: Cao → Thấp, cùng mức thì theo hạn', () => {
    expect(titles(sortTasks([a, b, c, d], 'priority'))).toEqual(['C', 'B', 'D', 'A']);
  });
  it('created: mới nhất trước', () => {
    expect(titles(sortTasks([a, b, c, d], 'created'))).toEqual(['D', 'B', 'C', 'A']);
  });
  it('không sửa mảng gốc', () => {
    const input = [a, b];
    sortTasks(input, 'created');
    expect(titles(input)).toEqual(['A', 'B']);
  });
});

describe('parse URL params', () => {
  it('trạng thái hợp lệ hoặc all', () => {
    expect(parseStatusFilter('in_progress')).toBe('in_progress');
    expect(parseStatusFilter('xyz')).toBe('all');
    expect(parseStatusFilter(null)).toBe('all');
  });
  it('kiểu sắp xếp hợp lệ hoặc due', () => {
    expect(parseSortKey('priority')).toBe('priority');
    expect(parseSortKey('abc')).toBe('due');
    expect(parseSortKey(null)).toBe('due');
  });
});
```

- [ ] **Step 2: Chạy để thấy thất bại**

Run: `npx vitest run src/domain/query.test.ts`
Expected: FAIL — không tìm thấy module `./query`.

- [ ] **Step 3: Viết `src/domain/query.ts`**

```ts
import { TASK_STATUSES, type Priority, type Task, type TaskStatus } from './task';

export type StatusFilter = TaskStatus | 'all';
export const SORT_KEYS = ['due', 'priority', 'created'] as const;
export type SortKey = (typeof SORT_KEYS)[number];

const PRIORITY_RANK: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .trim();
}

export function searchTasks(tasks: Task[], query: string): Task[] {
  const q = normalizeText(query);
  if (!q) return tasks;
  return tasks.filter((t) => normalizeText(t.title).includes(q));
}

export function filterByStatus(tasks: Task[], status: StatusFilter): Task[] {
  return status === 'all' ? tasks : tasks.filter((t) => t.status === status);
}

export function countByStatus(tasks: Task[]): Record<StatusFilter, number> {
  const counts: Record<StatusFilter, number> = {
    all: tasks.length,
    todo: 0,
    in_progress: 0,
    done: 0,
    on_hold: 0,
  };
  for (const t of tasks) counts[t.status] += 1;
  return counts;
}

function compareDue(a: Task, b: Task): number {
  if (a.dueAt === b.dueAt) return 0;
  if (a.dueAt === null) return 1;
  if (b.dueAt === null) return -1;
  return Date.parse(a.dueAt) - Date.parse(b.dueAt);
}

function compareCreatedDesc(a: Task, b: Task): number {
  return Date.parse(b.createdAt) - Date.parse(a.createdAt);
}

export function sortTasks(tasks: Task[], key: SortKey): Task[] {
  const copy = [...tasks];
  if (key === 'due') return copy.sort((a, b) => compareDue(a, b) || compareCreatedDesc(a, b));
  if (key === 'priority') {
    return copy.sort(
      (a, b) =>
        PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
        compareDue(a, b) ||
        compareCreatedDesc(a, b),
    );
  }
  return copy.sort(compareCreatedDesc);
}

export function parseStatusFilter(value: string | null): StatusFilter {
  return value !== null && (TASK_STATUSES as readonly string[]).includes(value)
    ? (value as TaskStatus)
    : 'all';
}

export function parseSortKey(value: string | null): SortKey {
  return value !== null && (SORT_KEYS as readonly string[]).includes(value)
    ? (value as SortKey)
    : 'due';
}
```

- [ ] **Step 4: Chạy test**

Run: `npx vitest run src/domain/query.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/query.ts src/domain/query.test.ts
git commit -m "feat(domain): tìm kiếm không dấu, lọc, đếm và sắp xếp công việc" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Logic thứ tự Kanban

**Files:**
- Create: `src/domain/kanban.ts`
- Test: `src/domain/kanban.test.ts`

**Interfaces:**
- Consumes: `Task`, `TaskStatus`, `TaskUpdate` từ `task.ts`
- Produces: `topPosition(tasksInColumn: Task[]): number`, `sortByPosition(tasks): Task[]`, `computeDrop(tasks, activeId, targetStatus, overTaskId: string | null): TaskUpdate[]`

- [ ] **Step 1: Viết test thất bại**

`src/domain/kanban.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { makeTask } from '../test/factories';
import { computeDrop, sortByPosition, topPosition } from './kanban';

describe('topPosition', () => {
  it('cột rỗng thì 0', () => {
    expect(topPosition([])).toBe(0);
  });
  it('nhỏ hơn vị trí nhỏ nhất 1 đơn vị', () => {
    expect(topPosition([makeTask({ position: 3 }), makeTask({ position: -1 }), makeTask({ position: 2 })])).toBe(-2);
  });
});

describe('sortByPosition', () => {
  it('theo position tăng dần, bằng nhau thì mới tạo trước', () => {
    const x = makeTask({ id: 'x', position: 1, createdAt: new Date(2026, 9, 1).toISOString() });
    const y = makeTask({ id: 'y', position: 1, createdAt: new Date(2026, 9, 2).toISOString() });
    const z = makeTask({ id: 'z', position: 0 });
    expect(sortByPosition([x, y, z]).map((t) => t.id)).toEqual(['z', 'y', 'x']);
  });
});

describe('computeDrop', () => {
  const board = () => [
    makeTask({ id: 'a', status: 'todo', position: 0 }),
    makeTask({ id: 'b', status: 'todo', position: 1 }),
    makeTask({ id: 'c', status: 'todo', position: 2 }),
    makeTask({ id: 'd', status: 'in_progress', position: 0 }),
  ];

  it('kéo xuống trong cùng cột: thả lên c thì a đứng sau c', () => {
    expect(computeDrop(board(), 'a', 'todo', 'c')).toEqual([
      { id: 'b', patch: { position: 0 } },
      { id: 'c', patch: { position: 1 } },
      { id: 'a', patch: { position: 2 } },
    ]);
  });

  it('kéo lên trong cùng cột: thả c lên a thì c đứng trước a', () => {
    expect(computeDrop(board(), 'c', 'todo', 'a')).toEqual([
      { id: 'c', patch: { position: 0 } },
      { id: 'a', patch: { position: 1 } },
      { id: 'b', patch: { position: 2 } },
    ]);
  });

  it('thả vào vùng trống của cột khác: xuống cuối và đổi trạng thái', () => {
    expect(computeDrop(board(), 'a', 'in_progress', null)).toEqual([
      { id: 'a', patch: { status: 'in_progress', position: 1 } },
    ]);
  });

  it('thả lên một thẻ ở cột khác: chen vào trước thẻ đó', () => {
    expect(computeDrop(board(), 'a', 'in_progress', 'd')).toEqual([
      { id: 'a', patch: { status: 'in_progress', position: 0 } },
      { id: 'd', patch: { position: 1 } },
    ]);
  });

  it('thả lên chính nó hoặc id lạ thì không làm gì', () => {
    expect(computeDrop(board(), 'b', 'todo', 'b')).toEqual([]);
    expect(computeDrop(board(), 'khong-co', 'todo', null)).toEqual([]);
  });
});
```

- [ ] **Step 2: Chạy để thấy thất bại**

Run: `npx vitest run src/domain/kanban.test.ts`
Expected: FAIL — không tìm thấy module `./kanban`.

- [ ] **Step 3: Viết `src/domain/kanban.ts`**

```ts
import type { Task, TaskStatus, TaskUpdate } from './task';

/** Vị trí để đặt một việc lên đầu cột (việc mới đứng đầu cột). */
export function topPosition(tasksInColumn: Task[]): number {
  if (tasksInColumn.length === 0) return 0;
  return Math.min(...tasksInColumn.map((t) => t.position)) - 1;
}

export function sortByPosition(tasks: Task[]): Task[] {
  return [...tasks].sort(
    (a, b) => a.position - b.position || Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );
}

/**
 * Tính các cập nhật khi thả thẻ `activeId` vào cột `targetStatus`.
 * `overTaskId` là thẻ bị thả lên (null = vùng trống của cột → xuống cuối).
 * Đánh số lại position 0..n-1 cho cột đích; chỉ trả về những việc thay đổi.
 */
export function computeDrop(
  tasks: Task[],
  activeId: string,
  targetStatus: TaskStatus,
  overTaskId: string | null,
): TaskUpdate[] {
  const active = tasks.find((t) => t.id === activeId);
  if (!active || overTaskId === activeId) return [];

  const original = sortByPosition(tasks.filter((t) => t.status === targetStatus));
  const column = original.filter((t) => t.id !== activeId);

  let index = overTaskId ? column.findIndex((t) => t.id === overTaskId) : -1;
  if (index === -1) index = column.length;

  // Kéo xuống trong cùng cột: đặt sau thẻ bị thả lên (giống arrayMove của dnd-kit).
  if (active.status === targetStatus && overTaskId) {
    const from = original.findIndex((t) => t.id === activeId);
    const to = original.findIndex((t) => t.id === overTaskId);
    if (from < to) index += 1;
  }

  column.splice(index, 0, active);

  const statusChanged = active.status !== targetStatus;
  const updates: TaskUpdate[] = [];
  column.forEach((task, position) => {
    if (task.id === activeId && statusChanged) {
      updates.push({ id: task.id, patch: { status: targetStatus, position } });
    } else if (task.position !== position) {
      updates.push({ id: task.id, patch: { position } });
    }
  });
  return updates;
}
```

- [ ] **Step 4: Chạy test**

Run: `npx vitest run src/domain/kanban.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/kanban.ts src/domain/kanban.test.ts
git commit -m "feat(domain): tính thứ tự và trạng thái khi kéo thả Kanban" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Số liệu báo cáo

**Files:**
- Create: `src/domain/stats.ts`
- Test: `src/domain/stats.test.ts`

**Interfaces:**
- Consumes: `Task`, `TaskStatus` từ `task.ts`; `isOverdue`, `isDueSoon` từ `rules.ts`
- Produces: `ReportSummary { total; byStatus: Record<TaskStatus, number>; completionRate: number }`, `summarize(tasks)`, `CompletionBucket { key; label; count }`, `completionsByDay(tasks, now, days = 7)`, `completionsByWeek(tasks, now, weeks = 8)`, `overdueTasks(tasks, now)`, `dueSoonTasks(tasks, now)`

- [ ] **Step 1: Viết test thất bại**

`src/domain/stats.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { makeTask } from '../test/factories';
import { completionsByDay, completionsByWeek, dueSoonTasks, overdueTasks, summarize } from './stats';

// 16/10/2026 là thứ Sáu; tuần bắt đầu thứ Hai 12/10.
const now = new Date(2026, 9, 16, 10, 0);
const iso = (y: number, m: number, d: number, h = 9, min = 0) => new Date(y, m - 1, d, h, min).toISOString();
const done = (completedAt: string) => makeTask({ status: 'done', completedAt });

describe('summarize', () => {
  it('đếm theo trạng thái và tỉ lệ hoàn thành làm tròn', () => {
    const tasks = [makeTask(), makeTask(), done(iso(2026, 10, 16)), makeTask({ status: 'in_progress' })];
    expect(summarize(tasks)).toEqual({
      total: 4,
      byStatus: { todo: 2, in_progress: 1, done: 1, on_hold: 0 },
      completionRate: 25,
    });
  });
  it('không có việc thì 0%', () => {
    expect(summarize([]).completionRate).toBe(0);
  });
  it('1/3 làm tròn thành 33', () => {
    expect(summarize([makeTask(), makeTask(), done(iso(2026, 10, 1))]).completionRate).toBe(33);
  });
});

describe('completionsByDay', () => {
  it('7 ngày gần nhất tính cả hôm nay, cũ trước', () => {
    const tasks = [done(iso(2026, 10, 16, 9)), done(iso(2026, 10, 15, 20)), done(iso(2026, 10, 9))];
    const buckets = completionsByDay(tasks, now);
    expect(buckets.map((b) => b.label)).toEqual(['10/10', '11/10', '12/10', '13/10', '14/10', '15/10', '16/10']);
    expect(buckets.map((b) => b.count)).toEqual([0, 0, 0, 0, 0, 1, 1]);
    expect(buckets[6].key).toBe('2026-10-16');
  });
});

describe('completionsByWeek', () => {
  it('8 tuần gần nhất, tuần bắt đầu thứ Hai', () => {
    const tasks = [
      done(iso(2026, 10, 12, 0, 30)), // thứ Hai tuần này
      done(iso(2026, 10, 11, 23)), // Chủ nhật tuần trước
      done(iso(2026, 8, 23)), // trước khoảng
    ];
    const buckets = completionsByWeek(tasks, now);
    expect(buckets.map((b) => b.label)).toEqual(['24/08', '31/08', '07/09', '14/09', '21/09', '28/09', '05/10', '12/10']);
    expect(buckets.map((b) => b.count)).toEqual([0, 0, 0, 0, 0, 0, 1, 1]);
  });
});

describe('overdueTasks / dueSoonTasks', () => {
  it('trễ hạn: trễ lâu nhất lên đầu', () => {
    const t1 = makeTask({ title: 'Trễ 1 ngày', dueAt: iso(2026, 10, 15) });
    const t2 = makeTask({ title: 'Trễ 3 ngày', dueAt: iso(2026, 10, 13) });
    const t3 = makeTask({ title: 'Xong rồi', dueAt: iso(2026, 10, 13), status: 'done' });
    expect(overdueTasks([t1, t2, t3], now).map((t) => t.title)).toEqual(['Trễ 3 ngày', 'Trễ 1 ngày']);
  });
  it('sắp đến hạn: gần nhất lên đầu, chỉ trong 3 ngày', () => {
    const t1 = makeTask({ title: 'Còn 2 ngày', dueAt: iso(2026, 10, 18) });
    const t2 = makeTask({ title: 'Còn 2 giờ', dueAt: iso(2026, 10, 16, 12) });
    const t3 = makeTask({ title: 'Còn 5 ngày', dueAt: iso(2026, 10, 21) });
    expect(dueSoonTasks([t1, t2, t3], now).map((t) => t.title)).toEqual(['Còn 2 giờ', 'Còn 2 ngày']);
  });
});
```

- [ ] **Step 2: Chạy để thấy thất bại**

Run: `npx vitest run src/domain/stats.test.ts`
Expected: FAIL — không tìm thấy module `./stats`.

- [ ] **Step 3: Viết `src/domain/stats.ts`**

```ts
import { addDays, addWeeks, format, startOfDay, startOfWeek, subDays, subWeeks } from 'date-fns';
import { isDueSoon, isOverdue } from './rules';
import type { Task, TaskStatus } from './task';

export interface ReportSummary {
  total: number;
  byStatus: Record<TaskStatus, number>;
  completionRate: number;
}

export interface CompletionBucket {
  key: string;
  label: string;
  count: number;
}

const WEEK_OPTIONS = { weekStartsOn: 1 } as const;

export function summarize(tasks: Task[]): ReportSummary {
  const byStatus: Record<TaskStatus, number> = { todo: 0, in_progress: 0, done: 0, on_hold: 0 };
  for (const t of tasks) byStatus[t.status] += 1;
  const total = tasks.length;
  return {
    total,
    byStatus,
    completionRate: total === 0 ? 0 : Math.round((byStatus.done / total) * 100),
  };
}

function bucketize(tasks: Task[], starts: Date[], keyOf: (d: Date) => string): CompletionBucket[] {
  const buckets = starts.map((d) => ({ key: keyOf(d), label: format(d, 'dd/MM'), count: 0 }));
  const index = new Map(buckets.map((b) => [b.key, b]));
  for (const t of tasks) {
    if (!t.completedAt) continue;
    const bucket = index.get(keyOf(new Date(t.completedAt)));
    if (bucket) bucket.count += 1;
  }
  return buckets;
}

export function completionsByDay(tasks: Task[], now: Date, days = 7): CompletionBucket[] {
  const first = startOfDay(subDays(now, days - 1));
  const starts = Array.from({ length: days }, (_, i) => addDays(first, i));
  return bucketize(tasks, starts, (d) => format(d, 'yyyy-MM-dd'));
}

export function completionsByWeek(tasks: Task[], now: Date, weeks = 8): CompletionBucket[] {
  const first = startOfWeek(subWeeks(now, weeks - 1), WEEK_OPTIONS);
  const starts = Array.from({ length: weeks }, (_, i) => addWeeks(first, i));
  return bucketize(tasks, starts, (d) => format(startOfWeek(d, WEEK_OPTIONS), 'yyyy-MM-dd'));
}

const byDueAsc = (a: Task, b: Task) => Date.parse(a.dueAt!) - Date.parse(b.dueAt!);

export function overdueTasks(tasks: Task[], now: Date): Task[] {
  return tasks.filter((t) => isOverdue(t, now)).sort(byDueAsc);
}

export function dueSoonTasks(tasks: Task[], now: Date): Task[] {
  return tasks.filter((t) => isDueSoon(t, now)).sort(byDueAsc);
}
```

- [ ] **Step 4: Chạy test**

Run: `npx vitest run src/domain/stats.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/stats.ts src/domain/stats.test.ts
git commit -m "feat(domain): tính số liệu báo cáo theo trạng thái, ngày, tuần" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Logic chọn việc cần nhắc

**Files:**
- Create: `src/domain/reminders.ts`
- Test: `src/domain/reminders.test.ts`

**Interfaces:**
- Consumes: `Task` từ `task.ts`; `isOverdue` từ `rules.ts`
- Produces: `REMINDER_LEAD_MS`, `OVERDUE_NOTIFY_WINDOW_MS`, `ReminderKind = 'due_soon' | 'overdue'`, `Reminder { key; kind; task }`, `reminderKey(task, kind)`, `dueReminders(tasks, now, sent: ReadonlySet<string>): Reminder[]`, `DailySummary { dueToday; overdue }`, `dailySummary(tasks, now): DailySummary | null`, `pruneSentKeys(keys: string[], tasks): string[]`

- [ ] **Step 1: Viết test thất bại**

`src/domain/reminders.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { makeTask } from '../test/factories';
import { dailySummary, dueReminders, pruneSentKeys, reminderKey } from './reminders';

const now = new Date(2026, 9, 16, 10, 0);
const at = (d: number, h: number, m = 0) => new Date(2026, 9, d, h, m).toISOString();

const soon = makeTask({ id: 'soon', title: 'Còn 30 phút', dueAt: at(16, 10, 30) });
const justLate = makeTask({ id: 'late', title: 'Trễ 2 giờ', dueAt: at(16, 8) });
const longLate = makeTask({ id: 'old', title: 'Trễ 2 ngày', dueAt: at(14, 9) });
const later = makeTask({ id: 'later', title: 'Còn 2 giờ', dueAt: at(16, 12) });
const finished = makeTask({ id: 'fin', title: 'Đã xong', dueAt: at(16, 10, 15), status: 'done' });
const all = [soon, justLate, longLate, later, finished];

describe('dueReminders', () => {
  it('nhắc việc còn ≤ 1 giờ và việc trễ ≤ 24 giờ', () => {
    const result = dueReminders(all, now, new Set());
    expect(result.map((r) => [r.task.id, r.kind])).toEqual([
      ['soon', 'due_soon'],
      ['late', 'overdue'],
    ]);
    expect(result[0].key).toBe(`soon:${soon.dueAt}:due_soon`);
  });
  it('bỏ qua khoá đã nhắc', () => {
    const sent = new Set([reminderKey(soon, 'due_soon')]);
    expect(dueReminders(all, now, sent).map((r) => r.task.id)).toEqual(['late']);
  });
});

describe('dailySummary', () => {
  it('đếm việc đến hạn hôm nay (chưa trễ) và việc đang trễ', () => {
    expect(dailySummary(all, now)).toEqual({ dueToday: 2, overdue: 2 });
  });
  it('không có gì thì null', () => {
    expect(dailySummary([makeTask({ dueAt: at(20, 9) })], now)).toBeNull();
  });
});

describe('pruneSentKeys', () => {
  it('giữ khoá của việc còn tồn tại, chưa xong, đúng dueAt hiện tại', () => {
    const keys = [
      reminderKey(soon, 'due_soon'),
      `soon:${at(1, 9)}:due_soon`, // dueAt cũ
      reminderKey(finished, 'due_soon'), // đã xong
      'deleted:2026-10-01T00:00:00.000Z:overdue', // đã xoá
    ];
    expect(pruneSentKeys(keys, all)).toEqual([reminderKey(soon, 'due_soon')]);
  });
});
```

- [ ] **Step 2: Chạy để thấy thất bại**

Run: `npx vitest run src/domain/reminders.test.ts`
Expected: FAIL — không tìm thấy module `./reminders`.

- [ ] **Step 3: Viết `src/domain/reminders.ts`**

```ts
import { isOverdue } from './rules';
import type { Task } from './task';

export const REMINDER_LEAD_MS = 60 * 60 * 1000;
export const OVERDUE_NOTIFY_WINDOW_MS = 24 * 60 * 60 * 1000;

export type ReminderKind = 'due_soon' | 'overdue';

export interface Reminder {
  key: string;
  kind: ReminderKind;
  task: Task;
}

export interface DailySummary {
  dueToday: number;
  overdue: number;
}

export function reminderKey(task: Pick<Task, 'id' | 'dueAt'>, kind: ReminderKind): string {
  return `${task.id}:${task.dueAt}:${kind}`;
}

export function dueReminders(tasks: Task[], now: Date, sent: ReadonlySet<string>): Reminder[] {
  const result: Reminder[] = [];
  for (const task of tasks) {
    if (task.status === 'done' || task.dueAt === null) continue;
    const diff = Date.parse(task.dueAt) - now.getTime();
    let kind: ReminderKind | null = null;
    if (diff >= 0 && diff <= REMINDER_LEAD_MS) kind = 'due_soon';
    else if (diff < 0 && -diff <= OVERDUE_NOTIFY_WINDOW_MS) kind = 'overdue';
    if (!kind) continue;
    const key = reminderKey(task, kind);
    if (!sent.has(key)) result.push({ key, kind, task });
  }
  return result;
}

function sameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  );
}

export function dailySummary(tasks: Task[], now: Date): DailySummary | null {
  let dueToday = 0;
  let overdue = 0;
  for (const task of tasks) {
    if (task.status === 'done' || task.dueAt === null) continue;
    if (isOverdue(task, now)) overdue += 1;
    else if (sameLocalDay(new Date(task.dueAt), now)) dueToday += 1;
  }
  return dueToday === 0 && overdue === 0 ? null : { dueToday, overdue };
}

export function pruneSentKeys(keys: string[], tasks: Task[]): string[] {
  const prefixes = new Set(
    tasks.filter((t) => t.status !== 'done' && t.dueAt !== null).map((t) => `${t.id}:${t.dueAt}:`),
  );
  return keys.filter((key) => {
    const prefix = key.slice(0, key.lastIndexOf(':') + 1);
    return prefixes.has(prefix);
  });
}
```

- [ ] **Step 4: Chạy test**

Run: `npx vitest run src/domain/reminders.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/reminders.ts src/domain/reminders.test.ts
git commit -m "feat(domain): chọn việc cần nhắc, tóm tắt trong ngày, dọn khoá cũ" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Repository interface, bộ test hợp đồng và bản cài đặt Dexie

**Files:**
- Create: `src/lib/id.ts`, `src/lib/object.ts`
- Create: `src/data/repository.ts`, `src/data/repositoryContract.ts`
- Create: `src/data/dexie/db.ts`, `src/data/dexie/DexieTaskRepository.ts`, `src/data/dexie/DexieLabelRepository.ts`, `src/data/dexie/createDexieRepositories.ts`
- Test: `src/data/dexie/dexie.test.ts`

**Interfaces:**
- Consumes: kiểu từ `domain/task.ts`; `applyStatusChange`, `normalizeTitle`, `normalizeLabelName`, `sameLabelName` từ `rules.ts`; `topPosition` từ `kanban.ts`
- Produces:
  - `repository.ts`: `TaskRepository`, `LabelRepository`, `Repositories { tasks; labels; importData(data: { tasks: Task[]; labels: Label[] }): Promise<void> }`, `RepositoryErrorCode`, `class RepositoryError { code }`
  - `repositoryContract.ts`: `describeRepositoryContract(name, factory: (now: () => Date) => Repositories)`
  - `db.ts`: `class AppDatabase(name = 'cong-viec-cua-toi')`
  - `createDexieRepositories(db: AppDatabase, now?: () => Date): Repositories`
  - `lib/id.ts`: `newId(): string`; `lib/object.ts`: `stripUndefined(obj)`

- [ ] **Step 1: Tạo tiện ích và interface**

`src/lib/id.ts`:
```ts
export const newId = (): string => crypto.randomUUID();
```

`src/lib/object.ts`:
```ts
/** Bỏ các khoá có giá trị undefined để `{ ...a, ...patch }` không ghi đè bằng undefined. */
export function stripUndefined<T extends object>(value: T): Partial<T> {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as Partial<T>;
}
```

`src/data/repository.ts`:
```ts
import type { Label, LabelPatch, NewLabel, NewTask, Task, TaskPatch } from '../domain/task';

export interface TaskRepository {
  list(): Promise<Task[]>;
  create(input: NewTask): Promise<Task>;
  update(id: string, patch: TaskPatch): Promise<Task>;
  remove(id: string): Promise<void>;
  /** Ghi lại nguyên vẹn một việc đã xoá (phục vụ "Hoàn tác"). */
  restore(task: Task): Promise<void>;
}

export interface LabelRepository {
  list(): Promise<Label[]>;
  create(input: NewLabel): Promise<Label>;
  update(id: string, patch: LabelPatch): Promise<Label>;
  /** Xoá nhãn và gỡ nhãn khỏi mọi việc đang dùng. */
  remove(id: string): Promise<void>;
}

export interface Repositories {
  tasks: TaskRepository;
  labels: LabelRepository;
  /** Gộp theo id (trùng thì ghi đè) trong một giao dịch. */
  importData(data: { tasks: Task[]; labels: Label[] }): Promise<void>;
}

export type RepositoryErrorCode = 'NOT_FOUND' | 'INVALID_TITLE' | 'INVALID_LABEL_NAME' | 'DUPLICATE_LABEL';

export class RepositoryError extends Error {
  readonly code: RepositoryErrorCode;

  constructor(code: RepositoryErrorCode) {
    super(code);
    this.name = 'RepositoryError';
    this.code = code;
  }
}
```

- [ ] **Step 2: Viết bộ test hợp đồng**

`src/data/repositoryContract.ts` (bộ test dùng lại cho mọi bản cài đặt, kể cả Supabase sau này):
```ts
import { beforeEach, describe, expect, it } from 'vitest';
import type { Repositories } from './repository';

export function describeRepositoryContract(
  name: string,
  factory: (now: () => Date) => Repositories,
): void {
  describe(`Repository contract: ${name}`, () => {
    let clock: Date;
    let repos: Repositories;
    const tick = (minutes: number) => {
      clock = new Date(clock.getTime() + minutes * 60_000);
    };

    beforeEach(() => {
      clock = new Date(2026, 9, 16, 9, 0);
      repos = factory(() => clock);
    });

    describe('tasks', () => {
      it('tạo việc với giá trị mặc định và tên đã trim', async () => {
        const task = await repos.tasks.create({ title: '  Viết báo cáo  ' });
        expect(task).toMatchObject({
          title: 'Viết báo cáo',
          description: '',
          status: 'todo',
          priority: 'medium',
          dueAt: null,
          labelIds: [],
          completedAt: null,
          createdAt: clock.toISOString(),
          updatedAt: clock.toISOString(),
        });
        expect(task.id).toMatch(/^[0-9a-f-]{36}$/);
        expect(await repos.tasks.list()).toEqual([task]);
      });

      it('từ chối tên rỗng', async () => {
        await expect(repos.tasks.create({ title: '   ' })).rejects.toMatchObject({ code: 'INVALID_TITLE' });
      });

      it('tạo việc ở trạng thái Đã xong thì có completedAt', async () => {
        const task = await repos.tasks.create({ title: 'A', status: 'done' });
        expect(task.completedAt).toBe(clock.toISOString());
      });

      it('việc mới đứng đầu cột', async () => {
        const a = await repos.tasks.create({ title: 'A' });
        const b = await repos.tasks.create({ title: 'B' });
        expect(b.position).toBeLessThan(a.position);
      });

      it('chuyển sang Đã xong ghi completedAt, rời khỏi thì xoá', async () => {
        const task = await repos.tasks.create({ title: 'A' });
        tick(5);
        const done = await repos.tasks.update(task.id, { status: 'done' });
        expect(done.completedAt).toBe(clock.toISOString());
        expect(done.updatedAt).toBe(clock.toISOString());
        const back = await repos.tasks.update(task.id, { status: 'in_progress' });
        expect(back.completedAt).toBeNull();
      });

      it('đổi trạng thái đưa việc lên đầu cột mới', async () => {
        const a = await repos.tasks.create({ title: 'A' });
        const b = await repos.tasks.create({ title: 'B', status: 'in_progress' });
        const moved = await repos.tasks.update(a.id, { status: 'in_progress' });
        expect(moved.position).toBeLessThan(b.position);
      });

      it('update giữ trường không có trong patch và bỏ qua undefined', async () => {
        const dueAt = new Date(2026, 9, 20, 23, 59).toISOString();
        const task = await repos.tasks.create({ title: 'A', dueAt });
        const updated = await repos.tasks.update(task.id, { priority: 'high', dueAt: undefined });
        expect(updated).toMatchObject({ title: 'A', priority: 'high', dueAt });
      });

      it('update từ chối tên không hợp lệ', async () => {
        const task = await repos.tasks.create({ title: 'A' });
        await expect(repos.tasks.update(task.id, { title: ' ' })).rejects.toMatchObject({ code: 'INVALID_TITLE' });
      });

      it('update id không tồn tại', async () => {
        await expect(repos.tasks.update('khong-co', { title: 'X' })).rejects.toMatchObject({ code: 'NOT_FOUND' });
      });

      it('remove rồi restore khôi phục y nguyên', async () => {
        const task = await repos.tasks.create({ title: 'A', description: 'mô tả' });
        await repos.tasks.remove(task.id);
        expect(await repos.tasks.list()).toEqual([]);
        await repos.tasks.restore(task);
        expect(await repos.tasks.list()).toEqual([task]);
      });
    });

    describe('labels', () => {
      it('tạo nhãn và chống trùng tên không phân biệt hoa thường', async () => {
        const label = await repos.labels.create({ name: ' Công việc ', color: 'blue' });
        expect(label).toMatchObject({ name: 'Công việc', color: 'blue' });
        await expect(repos.labels.create({ name: 'CÔNG VIỆC', color: 'red' })).rejects.toMatchObject({
          code: 'DUPLICATE_LABEL',
        });
        await expect(repos.labels.create({ name: '', color: 'red' })).rejects.toMatchObject({
          code: 'INVALID_LABEL_NAME',
        });
      });

      it('đổi tên sang tên trùng bị từ chối, đổi chính nó thì được', async () => {
        const a = await repos.labels.create({ name: 'A', color: 'blue' });
        await repos.labels.create({ name: 'B', color: 'blue' });
        await expect(repos.labels.update(a.id, { name: 'b' })).rejects.toMatchObject({ code: 'DUPLICATE_LABEL' });
        expect(await repos.labels.update(a.id, { name: 'a', color: 'green' })).toEqual({
          id: a.id,
          name: 'a',
          color: 'green',
        });
      });

      it('xoá nhãn gỡ nhãn khỏi các việc', async () => {
        const label = await repos.labels.create({ name: 'A', color: 'blue' });
        const task = await repos.tasks.create({ title: 'T', labelIds: [label.id, 'khac'] });
        await repos.labels.remove(label.id);
        expect(await repos.labels.list()).toEqual([]);
        const [saved] = await repos.tasks.list();
        expect(saved.id).toBe(task.id);
        expect(saved.labelIds).toEqual(['khac']);
      });
    });

    it('importData gộp theo id', async () => {
      const existing = await repos.tasks.create({ title: 'Cũ' });
      const incoming = { ...existing, title: 'Mới' };
      const extra = { ...existing, id: '00000000-0000-4000-8000-000000000001', title: 'Thêm' };
      const label = { id: '00000000-0000-4000-8000-000000000002', name: 'Nhập', color: 'teal' as const };
      await repos.importData({ tasks: [incoming, extra], labels: [label] });
      const titles = (await repos.tasks.list()).map((t) => t.title).sort();
      expect(titles).toEqual(['Mới', 'Thêm']);
      expect(await repos.labels.list()).toEqual([label]);
    });
  });
}
```

`src/data/dexie/dexie.test.ts`:
```ts
import { describeRepositoryContract } from '../repositoryContract';
import { createDexieRepositories } from './createDexieRepositories';
import { AppDatabase } from './db';

describeRepositoryContract('Dexie', (now) =>
  createDexieRepositories(new AppDatabase(`test-${crypto.randomUUID()}`), now),
);
```

- [ ] **Step 3: Chạy để thấy thất bại**

Run: `npx vitest run src/data`
Expected: FAIL — không tìm thấy module `./createDexieRepositories` và `./db`.

- [ ] **Step 4: Viết bản cài đặt Dexie**

`src/data/dexie/db.ts`:
```ts
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
```

`src/data/dexie/DexieTaskRepository.ts`:
```ts
import { topPosition } from '../../domain/kanban';
import { applyStatusChange, normalizeTitle } from '../../domain/rules';
import type { NewTask, Task, TaskPatch } from '../../domain/task';
import { newId } from '../../lib/id';
import { stripUndefined } from '../../lib/object';
import { RepositoryError, type TaskRepository } from '../repository';
import type { AppDatabase } from './db';

export class DexieTaskRepository implements TaskRepository {
  constructor(
    private readonly db: AppDatabase,
    private readonly now: () => Date = () => new Date(),
  ) {}

  list(): Promise<Task[]> {
    return this.db.tasks.toArray();
  }

  create(input: NewTask): Promise<Task> {
    const title = normalizeTitle(input.title);
    if (!title) return Promise.reject(new RepositoryError('INVALID_TITLE'));
    return this.db.transaction('rw', this.db.tasks, async () => {
      const status = input.status ?? 'todo';
      const siblings = await this.db.tasks.where('status').equals(status).toArray();
      const ts = this.now().toISOString();
      const task: Task = {
        id: newId(),
        title,
        description: input.description ?? '',
        status,
        priority: input.priority ?? 'medium',
        dueAt: input.dueAt ?? null,
        labelIds: input.labelIds ?? [],
        position: topPosition(siblings),
        createdAt: ts,
        updatedAt: ts,
        completedAt: status === 'done' ? ts : null,
      };
      await this.db.tasks.add(task);
      return task;
    });
  }

  update(id: string, patch: TaskPatch): Promise<Task> {
    return this.db.transaction('rw', this.db.tasks, async () => {
      const current = await this.db.tasks.get(id);
      if (!current) throw new RepositoryError('NOT_FOUND');
      const clean = stripUndefined(patch);
      const now = this.now();
      const next: Task = { ...current, ...clean, updatedAt: now.toISOString() };

      if (clean.title !== undefined) {
        const title = normalizeTitle(clean.title);
        if (!title) throw new RepositoryError('INVALID_TITLE');
        next.title = title;
      }
      if (clean.status !== undefined) {
        Object.assign(next, applyStatusChange(current, clean.status, now));
        if (clean.status !== current.status && clean.position === undefined) {
          const siblings = await this.db.tasks.where('status').equals(clean.status).toArray();
          next.position = topPosition(siblings);
        }
      }
      await this.db.tasks.put(next);
      return next;
    });
  }

  async remove(id: string): Promise<void> {
    await this.db.tasks.delete(id);
  }

  async restore(task: Task): Promise<void> {
    await this.db.tasks.put(task);
  }
}
```

`src/data/dexie/DexieLabelRepository.ts`:
```ts
import { normalizeLabelName, sameLabelName } from '../../domain/rules';
import type { Label, LabelPatch, NewLabel } from '../../domain/task';
import { newId } from '../../lib/id';
import { stripUndefined } from '../../lib/object';
import { RepositoryError, type LabelRepository } from '../repository';
import type { AppDatabase } from './db';

export class DexieLabelRepository implements LabelRepository {
  constructor(private readonly db: AppDatabase) {}

  list(): Promise<Label[]> {
    return this.db.labels.toArray();
  }

  private async assertUniqueName(name: string, exceptId?: string): Promise<void> {
    const all = await this.db.labels.toArray();
    if (all.some((l) => l.id !== exceptId && sameLabelName(l.name, name))) {
      throw new RepositoryError('DUPLICATE_LABEL');
    }
  }

  create(input: NewLabel): Promise<Label> {
    const name = normalizeLabelName(input.name);
    if (!name) return Promise.reject(new RepositoryError('INVALID_LABEL_NAME'));
    return this.db.transaction('rw', this.db.labels, async () => {
      await this.assertUniqueName(name);
      const label: Label = { id: newId(), name, color: input.color };
      await this.db.labels.add(label);
      return label;
    });
  }

  update(id: string, patch: LabelPatch): Promise<Label> {
    return this.db.transaction('rw', this.db.labels, async () => {
      const current = await this.db.labels.get(id);
      if (!current) throw new RepositoryError('NOT_FOUND');
      const clean = stripUndefined(patch);
      const next: Label = { ...current, ...clean };
      if (clean.name !== undefined) {
        const name = normalizeLabelName(clean.name);
        if (!name) throw new RepositoryError('INVALID_LABEL_NAME');
        await this.assertUniqueName(name, id);
        next.name = name;
      }
      await this.db.labels.put(next);
      return next;
    });
  }

  remove(id: string): Promise<void> {
    return this.db.transaction('rw', this.db.tasks, this.db.labels, async () => {
      await this.db.tasks
        .filter((t) => t.labelIds.includes(id))
        .modify((t) => {
          t.labelIds = t.labelIds.filter((labelId) => labelId !== id);
        });
      await this.db.labels.delete(id);
    });
  }
}
```

`src/data/dexie/createDexieRepositories.ts`:
```ts
import type { Repositories } from '../repository';
import type { AppDatabase } from './db';
import { DexieLabelRepository } from './DexieLabelRepository';
import { DexieTaskRepository } from './DexieTaskRepository';

export function createDexieRepositories(db: AppDatabase, now: () => Date = () => new Date()): Repositories {
  return {
    tasks: new DexieTaskRepository(db, now),
    labels: new DexieLabelRepository(db),
    importData: ({ tasks, labels }) =>
      db.transaction('rw', db.tasks, db.labels, async () => {
        await db.labels.bulkPut(labels);
        await db.tasks.bulkPut(tasks);
      }),
  };
}
```

- [ ] **Step 5: Chạy test**

Run: `npx vitest run src/data`
Expected: PASS (15 test trong "Repository contract: Dexie").

- [ ] **Step 6: Kiểm tra kiểu**

Run: `npm run typecheck`
Expected: không lỗi.

- [ ] **Step 7: Commit**

```bash
git add src/lib src/data
git commit -m "feat(data): repository interface, bộ test hợp đồng và bản cài đặt Dexie" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Xuất / nhập file sao lưu JSON

**Files:**
- Create: `src/data/backup.ts`
- Test: `src/data/backup.test.ts`

**Interfaces:**
- Consumes: `TASK_STATUSES`, `PRIORITIES`, `LABEL_COLORS`, `Task`, `Label` từ `task.ts`; `createDexieRepositories`, `AppDatabase` (chỉ trong test)
- Produces: `BACKUP_APP = 'cong-viec-cua-toi'`, `backupSchema`, `BackupFile`, `createBackup(tasks, labels, now): BackupFile`, `backupFileName(now): string`, `ParseResult`, `parseBackup(text): ParseResult`, `ImportPreview { newTasks; overwrittenTasks; newLabels; overwrittenLabels }`, `previewImport(backup, existingTasks, existingLabels): ImportPreview`

- [ ] **Step 1: Viết test thất bại**

`src/data/backup.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { makeLabel, makeTask } from '../test/factories';
import { backupFileName, createBackup, parseBackup, previewImport } from './backup';
import { createDexieRepositories } from './dexie/createDexieRepositories';
import { AppDatabase } from './dexie/db';

const now = new Date(2026, 9, 16, 10, 0);

describe('createBackup / parseBackup', () => {
  it('xuất rồi đọc lại cho ra dữ liệu giống hệt', () => {
    const backup = createBackup([makeTask({ dueAt: now.toISOString() })], [makeLabel()], now);
    expect(backup).toMatchObject({ app: 'cong-viec-cua-toi', version: 1, exportedAt: now.toISOString() });
    const parsed = parseBackup(JSON.stringify(backup));
    expect(parsed).toEqual({ ok: true, data: backup });
  });

  it('không phải JSON', () => {
    expect(parseBackup('{oops')).toEqual({ ok: false, error: 'File không phải JSON hợp lệ' });
  });

  it('sai ứng dụng hoặc sai cấu trúc', () => {
    const wrongApp = { ...createBackup([], [], now), app: 'khac' };
    expect(parseBackup(JSON.stringify(wrongApp))).toEqual({
      ok: false,
      error: 'File không đúng định dạng sao lưu của Công Việc Của Tôi',
    });
    const badTask = createBackup([{ ...makeTask(), status: 'xyz' as never }], [], now);
    expect(parseBackup(JSON.stringify(badTask)).ok).toBe(false);
  });

  it('tên file theo ngày', () => {
    expect(backupFileName(now)).toBe('cong-viec-cua-toi-2026-10-16.json');
  });
});

describe('previewImport', () => {
  it('đếm số thêm mới và ghi đè', () => {
    const existing = makeTask();
    const label = makeLabel();
    const backup = createBackup([existing, makeTask(), makeTask()], [label], now);
    expect(previewImport(backup, [existing], [])).toEqual({
      newTasks: 2,
      overwrittenTasks: 1,
      newLabels: 1,
      overwrittenLabels: 0,
    });
  });
});

it('xuất từ kho A rồi nhập vào kho B cho dữ liệu giống nhau', async () => {
  const a = createDexieRepositories(new AppDatabase(`test-${crypto.randomUUID()}`));
  const b = createDexieRepositories(new AppDatabase(`test-${crypto.randomUUID()}`));
  const label = await a.labels.create({ name: 'Công việc', color: 'blue' });
  await a.tasks.create({ title: 'Viết báo cáo', labelIds: [label.id] });
  await a.tasks.create({ title: 'Mua sữa', status: 'done' });

  const text = JSON.stringify(createBackup(await a.tasks.list(), await a.labels.list(), now));
  const parsed = parseBackup(text);
  if (!parsed.ok) throw new Error(parsed.error);
  await b.importData({ tasks: parsed.data.tasks, labels: parsed.data.labels });

  const byId = <T extends { id: string }>(list: T[]) => [...list].sort((x, y) => x.id.localeCompare(y.id));
  expect(byId(await b.tasks.list())).toEqual(byId(await a.tasks.list()));
  expect(await b.labels.list()).toEqual(await a.labels.list());
});
```

- [ ] **Step 2: Chạy để thấy thất bại**

Run: `npx vitest run src/data/backup.test.ts`
Expected: FAIL — không tìm thấy module `./backup`.

- [ ] **Step 3: Viết `src/data/backup.ts`**

```ts
import { format } from 'date-fns';
import { z } from 'zod';
import { LABEL_COLORS, PRIORITIES, TASK_STATUSES, type Label, type Task } from '../domain/task';

export const BACKUP_APP = 'cong-viec-cua-toi';

const taskSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string(),
  status: z.enum(TASK_STATUSES),
  priority: z.enum(PRIORITIES),
  dueAt: z.iso.datetime().nullable(),
  labelIds: z.array(z.string()),
  position: z.number(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  completedAt: z.iso.datetime().nullable(),
});

const labelSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(30),
  color: z.enum(LABEL_COLORS),
});

export const backupSchema = z.object({
  app: z.literal(BACKUP_APP),
  version: z.literal(1),
  exportedAt: z.iso.datetime(),
  tasks: z.array(taskSchema),
  labels: z.array(labelSchema),
});

export type BackupFile = z.infer<typeof backupSchema>;

export type ParseResult = { ok: true; data: BackupFile } | { ok: false; error: string };

export interface ImportPreview {
  newTasks: number;
  overwrittenTasks: number;
  newLabels: number;
  overwrittenLabels: number;
}

export function createBackup(tasks: Task[], labels: Label[], now: Date): BackupFile {
  return { app: BACKUP_APP, version: 1, exportedAt: now.toISOString(), tasks, labels };
}

export function backupFileName(now: Date): string {
  return `${BACKUP_APP}-${format(now, 'yyyy-MM-dd')}.json`;
}

export function parseBackup(text: string): ParseResult {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, error: 'File không phải JSON hợp lệ' };
  }
  const result = backupSchema.safeParse(json);
  if (!result.success) {
    return { ok: false, error: 'File không đúng định dạng sao lưu của Công Việc Của Tôi' };
  }
  return { ok: true, data: result.data };
}

export function previewImport(backup: BackupFile, existingTasks: Task[], existingLabels: Label[]): ImportPreview {
  const taskIds = new Set(existingTasks.map((t) => t.id));
  const labelIds = new Set(existingLabels.map((l) => l.id));
  const overwrittenTasks = backup.tasks.filter((t) => taskIds.has(t.id)).length;
  const overwrittenLabels = backup.labels.filter((l) => labelIds.has(l.id)).length;
  return {
    newTasks: backup.tasks.length - overwrittenTasks,
    overwrittenTasks,
    newLabels: backup.labels.length - overwrittenLabels,
    overwrittenLabels,
  };
}
```

- [ ] **Step 4: Chạy test**

Run: `npx vitest run src/data/backup.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/data/backup.ts src/data/backup.test.ts
git commit -m "feat(data): xuất / nhập file sao lưu JSON có kiểm tra bằng zod" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Providers, hook dữ liệu, toast và tuỳ chọn người dùng

**Files:**
- Create: `src/lib/prefs.ts`, `src/lib/errors.ts`
- Create: `src/components/ui/styles.ts`, `src/components/ui/Toast.tsx`
- Create: `src/app/queryClient.ts`, `src/app/AppProviders.tsx`
- Create: `src/hooks/RepositoryContext.tsx`, `src/hooks/queryKeys.ts`, `src/hooks/useTasks.ts`, `src/hooks/useLabels.ts`, `src/hooks/useImportData.ts`
- Create: `src/test/render.tsx`
- Test: `src/lib/prefs.test.ts`, `src/hooks/hooks.test.tsx`

**Interfaces:**
- Consumes: `Repositories`, `RepositoryError` (Task 7); `applyStatusChange` (Task 2); kiểu từ `task.ts`
- Produces:
  - `prefs.ts`: `PREF_KEYS { view, theme, reminders, remindersSent, lastSummaryDate, lastBackupAt }`, `readPref<T>(key, fallback)`, `writePref<T>(key, value)`, `usePref<T>(key, fallback): [T, (v: T) => void]`
  - `errors.ts`: `SAVE_ERROR = 'Không lưu được, thử lại'`, `errorMessage(error: unknown): string`
  - `styles.ts`: `btn.{primary,secondary,ghost,danger}`, `field`, `card`
  - `Toast.tsx`: `ToastProvider`, `useToast(): { show(o: ToastOptions): void }`, `ToastOptions { message; actionLabel?; onAction?; durationMs? }`
  - `queryClient.ts`: `createQueryClient()`
  - `AppProviders({ repositories, queryClient?, children })`
  - `RepositoryContext.tsx`: `RepositoryProvider`, `useRepositories()`
  - `queryKeys.ts`: `taskKeys.all = ['tasks']`, `labelKeys.all = ['labels']`
  - `useTasks.ts`: `useTasks()`, `useCreateTask()` (biến: `NewTask`), `useUpdateTasks()` (biến: `TaskUpdate[]`, cập nhật lạc quan), `useDeleteTask()` (biến: `Task`, có toast Hoàn tác)
  - `useLabels.ts`: `useLabels()`, `useCreateLabel()` (`NewLabel`), `useUpdateLabel()` (`{ id; patch: LabelPatch }`), `useDeleteLabel()` (`string`)
  - `useImportData.ts`: `useImportData()` (biến: `{ tasks; labels }`)
  - `test/render.tsx`: `createTestRepositories(now?)`, `createWrapper(repositories)`

- [ ] **Step 1: Viết test thất bại cho prefs**

`src/lib/prefs.test.ts`:
```ts
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { readPref, usePref, writePref } from './prefs';

describe('prefs', () => {
  it('trả về giá trị mặc định khi chưa có', () => {
    expect(readPref('cvct.test', 'list')).toBe('list');
  });
  it('ghi rồi đọc lại', () => {
    writePref('cvct.test', { a: 1 });
    expect(readPref('cvct.test', null)).toEqual({ a: 1 });
  });
  it('JSON hỏng thì dùng mặc định', () => {
    localStorage.setItem('cvct.test', '{oops');
    expect(readPref('cvct.test', 'x')).toBe('x');
  });
  it('usePref cập nhật mọi nơi đang dùng cùng khoá', () => {
    const first = renderHook(() => usePref('cvct.view', 'list'));
    const second = renderHook(() => usePref('cvct.view', 'list'));
    act(() => first.result.current[1]('kanban'));
    expect(second.result.current[0]).toBe('kanban');
  });
});
```

- [ ] **Step 2: Chạy để thấy thất bại**

Run: `npx vitest run src/lib/prefs.test.ts`
Expected: FAIL — không tìm thấy module `./prefs`.

- [ ] **Step 3: Viết `src/lib/prefs.ts`**

```ts
import { useCallback, useMemo, useSyncExternalStore } from 'react';

const PREF_EVENT = 'cvct:pref-change';

export const PREF_KEYS = {
  view: 'cvct.view',
  theme: 'cvct.theme',
  reminders: 'cvct.reminders',
  remindersSent: 'cvct.remindersSent',
  lastSummaryDate: 'cvct.lastSummaryDate',
  lastBackupAt: 'cvct.lastBackupAt',
} as const;

function readRaw(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function parse<T>(raw: string | null, fallback: T): T {
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function readPref<T>(key: string, fallback: T): T {
  return parse(readRaw(key), fallback);
}

export function writePref<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Bộ nhớ bị chặn: bỏ qua, tuỳ chọn chỉ có hiệu lực trong phiên này.
  }
  window.dispatchEvent(new CustomEvent(PREF_EVENT, { detail: key }));
}

function subscribe(callback: () => void): () => void {
  window.addEventListener(PREF_EVENT, callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(PREF_EVENT, callback);
    window.removeEventListener('storage', callback);
  };
}

export function usePref<T>(key: string, fallback: T): [T, (value: T) => void] {
  const raw = useSyncExternalStore(subscribe, () => readRaw(key), () => null);
  const value = useMemo(() => parse(raw, fallback), [raw]); // fallback chỉ dùng khi raw null
  const setValue = useCallback((next: T) => writePref(key, next), [key]);
  return [value, setValue];
}
```

- [ ] **Step 4: Chạy test prefs**

Run: `npx vitest run src/lib/prefs.test.ts`
Expected: PASS.

- [ ] **Step 5: Tạo styles, toast, lỗi, query client, providers**

`src/components/ui/styles.ts`:
```ts
export const btn = {
  primary:
    'inline-flex items-center justify-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50',
  secondary:
    'inline-flex items-center justify-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800',
  ghost:
    'inline-flex items-center justify-center rounded-lg px-2 py-1 text-sm hover:bg-slate-100 dark:hover:bg-slate-800',
  danger:
    'inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950',
};

export const field =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900';

export const card = 'rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900';
```

`src/components/ui/Toast.tsx`:
```tsx
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';

export interface ToastOptions {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  durationMs?: number;
}

interface ToastItem extends ToastOptions {
  id: number;
}

interface ToastApi {
  show(options: ToastOptions): void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setItems((list) => list.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (options: ToastOptions) => {
      const id = nextId.current++;
      setItems((list) => [...list, { ...options, id }]);
      window.setTimeout(() => dismiss(id), options.durationMs ?? 4000);
    },
    [dismiss],
  );

  const api = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex flex-col items-center gap-2 px-4 md:bottom-6"
      >
        {items.map((t) => (
          <div
            key={t.id}
            role="status"
            className="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-xl bg-slate-900 px-4 py-3 text-sm text-white shadow-lg dark:bg-slate-700"
          >
            <span className="flex-1">{t.message}</span>
            {t.actionLabel && (
              <button
                type="button"
                className="font-semibold text-blue-300 hover:underline"
                onClick={() => {
                  t.onAction?.();
                  dismiss(t.id);
                }}
              >
                {t.actionLabel}
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast phải nằm trong ToastProvider');
  return ctx;
}
```

`src/lib/errors.ts`:
```ts
import { RepositoryError } from '../data/repository';

export const SAVE_ERROR = 'Không lưu được, thử lại';

export function errorMessage(error: unknown): string {
  if (error instanceof RepositoryError) {
    switch (error.code) {
      case 'DUPLICATE_LABEL':
        return 'Nhãn này đã tồn tại';
      case 'INVALID_LABEL_NAME':
        return 'Tên nhãn dài 1–30 ký tự';
      case 'INVALID_TITLE':
        return 'Tên công việc dài 1–200 ký tự';
      case 'NOT_FOUND':
        return 'Không tìm thấy dữ liệu';
    }
  }
  return SAVE_ERROR;
}
```

`src/app/queryClient.ts`:
```ts
import { QueryClient } from '@tanstack/react-query';

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      // Dữ liệu nằm trong máy: không chờ mạng, không tự tải lại, không thử lại.
      queries: { networkMode: 'always', staleTime: Infinity, retry: false, refetchOnWindowFocus: false },
      mutations: { networkMode: 'always', retry: false },
    },
  });
}
```

`src/hooks/RepositoryContext.tsx`:
```tsx
import { createContext, useContext, type ReactNode } from 'react';
import type { Repositories } from '../data/repository';

const RepositoryContext = createContext<Repositories | null>(null);

export function RepositoryProvider({ repositories, children }: { repositories: Repositories; children: ReactNode }) {
  return <RepositoryContext.Provider value={repositories}>{children}</RepositoryContext.Provider>;
}

export function useRepositories(): Repositories {
  const repositories = useContext(RepositoryContext);
  if (!repositories) throw new Error('useRepositories phải nằm trong RepositoryProvider');
  return repositories;
}
```

`src/app/AppProviders.tsx`:
```tsx
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { ToastProvider } from '../components/ui/Toast';
import type { Repositories } from '../data/repository';
import { RepositoryProvider } from '../hooks/RepositoryContext';
import { createQueryClient } from './queryClient';

export function AppProviders({
  repositories,
  queryClient,
  children,
}: {
  repositories: Repositories;
  queryClient?: QueryClient;
  children: ReactNode;
}) {
  const [client] = useState(() => queryClient ?? createQueryClient());
  return (
    <QueryClientProvider client={client}>
      <RepositoryProvider repositories={repositories}>
        <ToastProvider>{children}</ToastProvider>
      </RepositoryProvider>
    </QueryClientProvider>
  );
}
```

- [ ] **Step 6: Tạo tiện ích test**

`src/test/render.tsx`:
```tsx
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { AppProviders } from '../app/AppProviders';
import { createQueryClient } from '../app/queryClient';
import { createDexieRepositories } from '../data/dexie/createDexieRepositories';
import { AppDatabase } from '../data/dexie/db';
import type { Repositories } from '../data/repository';

export function createTestRepositories(now?: () => Date): Repositories {
  return createDexieRepositories(new AppDatabase(`test-${crypto.randomUUID()}`), now);
}

export function createWrapper(repositories: Repositories) {
  const queryClient = createQueryClient();
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <AppProviders repositories={repositories} queryClient={queryClient}>
        <MemoryRouter>{children}</MemoryRouter>
      </AppProviders>
    );
  };
}
```

- [ ] **Step 7: Viết test thất bại cho hooks**

`src/hooks/hooks.test.tsx`:
```tsx
import { act, renderHook, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { Repositories, TaskRepository } from '../data/repository';
import { SAVE_ERROR } from '../lib/errors';
import { createTestRepositories, createWrapper } from '../test/render';
import { useDeleteLabel, useLabels } from './useLabels';
import { useCreateTask, useDeleteTask, useTasks, useUpdateTasks } from './useTasks';

function withFailingUpdate(repos: Repositories): Repositories {
  const tasks: TaskRepository = {
    list: () => repos.tasks.list(),
    create: (input) => repos.tasks.create(input),
    update: () => Promise.reject(new Error('boom')),
    remove: (id) => repos.tasks.remove(id),
    restore: (task) => repos.tasks.restore(task),
  };
  return { ...repos, tasks };
}

describe('task hooks', () => {
  it('useCreateTask thêm việc và danh sách tự cập nhật', async () => {
    const repos = createTestRepositories();
    const { result } = renderHook(() => ({ list: useTasks(), create: useCreateTask() }), {
      wrapper: createWrapper(repos),
    });
    await waitFor(() => expect(result.current.list.isSuccess).toBe(true));
    await act(() => result.current.create.mutateAsync({ title: 'Mua sữa' }));
    await waitFor(() => expect(result.current.list.data?.map((t) => t.title)).toEqual(['Mua sữa']));
  });

  it('useUpdateTasks cập nhật lạc quan rồi lưu xuống kho', async () => {
    const repos = createTestRepositories();
    const task = await repos.tasks.create({ title: 'A' });
    const { result } = renderHook(() => ({ list: useTasks(), update: useUpdateTasks() }), {
      wrapper: createWrapper(repos),
    });
    await waitFor(() => expect(result.current.list.data).toHaveLength(1));
    act(() => result.current.update.mutate([{ id: task.id, patch: { status: 'done' } }]));
    await waitFor(() => expect(result.current.list.data?.[0].status).toBe('done'));
    const [saved] = await repos.tasks.list();
    expect(saved.status).toBe('done');
    expect(saved.completedAt).not.toBeNull();
  });

  it('lưu thất bại thì khôi phục và báo lỗi', async () => {
    const base = createTestRepositories();
    await base.tasks.create({ title: 'A' });
    const repos = withFailingUpdate(base);
    const { result } = renderHook(() => ({ list: useTasks(), update: useUpdateTasks() }), {
      wrapper: createWrapper(repos),
    });
    await waitFor(() => expect(result.current.list.data).toHaveLength(1));
    const id = result.current.list.data![0].id;
    act(() => result.current.update.mutate([{ id, patch: { status: 'done' } }]));
    expect(await screen.findByText(SAVE_ERROR)).toBeInTheDocument();
    await waitFor(() => expect(result.current.list.data?.[0].status).toBe('todo'));
  });

  it('useDeleteTask xoá và cho hoàn tác', async () => {
    const user = userEvent.setup();
    const repos = createTestRepositories();
    const task = await repos.tasks.create({ title: 'A' });
    const { result } = renderHook(() => ({ list: useTasks(), remove: useDeleteTask() }), {
      wrapper: createWrapper(repos),
    });
    await waitFor(() => expect(result.current.list.data).toHaveLength(1));
    act(() => result.current.remove.mutate(task));
    await waitFor(() => expect(result.current.list.data).toHaveLength(0));
    await user.click(await screen.findByRole('button', { name: 'Hoàn tác' }));
    await waitFor(() => expect(result.current.list.data).toEqual([task]));
  });
});

describe('label hooks', () => {
  it('xoá nhãn làm mới cả danh sách việc', async () => {
    const repos = createTestRepositories();
    const label = await repos.labels.create({ name: 'A', color: 'blue' });
    await repos.tasks.create({ title: 'T', labelIds: [label.id] });
    const { result } = renderHook(
      () => ({ tasks: useTasks(), labels: useLabels(), remove: useDeleteLabel() }),
      { wrapper: createWrapper(repos) },
    );
    await waitFor(() => expect(result.current.tasks.data?.[0].labelIds).toEqual([label.id]));
    await act(() => result.current.remove.mutateAsync(label.id));
    await waitFor(() => expect(result.current.tasks.data?.[0].labelIds).toEqual([]));
    expect(result.current.labels.data).toEqual([]);
  });
});
```

- [ ] **Step 8: Chạy để thấy thất bại**

Run: `npx vitest run src/hooks`
Expected: FAIL — không tìm thấy module `./useLabels` và `./useTasks`.

- [ ] **Step 9: Viết các hook**

`src/hooks/queryKeys.ts`:
```ts
export const taskKeys = { all: ['tasks'] as const };
export const labelKeys = { all: ['labels'] as const };
```

`src/hooks/useTasks.ts`:
```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../components/ui/Toast';
import { applyStatusChange } from '../domain/rules';
import type { NewTask, Task, TaskPatch, TaskUpdate } from '../domain/task';
import { SAVE_ERROR } from '../lib/errors';
import { stripUndefined } from '../lib/object';
import { taskKeys } from './queryKeys';
import { useRepositories } from './RepositoryContext';

export const UNDO_DURATION_MS = 5000;

export function useTasks() {
  const { tasks } = useRepositories();
  return useQuery({ queryKey: taskKeys.all, queryFn: () => tasks.list() });
}

export function useCreateTask() {
  const { tasks } = useRepositories();
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (input: NewTask) => tasks.create(input),
    onError: () => toast.show({ message: SAVE_ERROR }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: taskKeys.all }),
  });
}

function optimisticUpdate(task: Task, patch: TaskPatch, now: Date): Task {
  const next: Task = { ...task, ...stripUndefined(patch) };
  return patch.status ? { ...next, ...applyStatusChange(task, patch.status, now) } : next;
}

export function useUpdateTasks() {
  const { tasks } = useRepositories();
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation<Task[], Error, TaskUpdate[], { previous?: Task[] }>({
    mutationFn: (updates) => Promise.all(updates.map((u) => tasks.update(u.id, u.patch))),
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.all });
      const previous = queryClient.getQueryData<Task[]>(taskKeys.all);
      const now = new Date();
      queryClient.setQueryData<Task[]>(taskKeys.all, (old) =>
        old?.map((t) => {
          const update = updates.find((u) => u.id === t.id);
          return update ? optimisticUpdate(t, update.patch, now) : t;
        }),
      );
      return { previous };
    },
    onError: (_error, _updates, context) => {
      if (context?.previous) queryClient.setQueryData(taskKeys.all, context.previous);
      toast.show({ message: SAVE_ERROR });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: taskKeys.all }),
  });
}

export function useDeleteTask() {
  const { tasks } = useRepositories();
  const queryClient = useQueryClient();
  const toast = useToast();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: taskKeys.all });

  const restore = useMutation({
    mutationFn: (task: Task) => tasks.restore(task),
    onError: () => toast.show({ message: SAVE_ERROR }),
    onSettled: invalidate,
  });

  return useMutation<void, Error, Task, { previous?: Task[] }>({
    mutationFn: (task) => tasks.remove(task.id),
    onMutate: async (task) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.all });
      const previous = queryClient.getQueryData<Task[]>(taskKeys.all);
      queryClient.setQueryData<Task[]>(taskKeys.all, (old) => old?.filter((t) => t.id !== task.id));
      return { previous };
    },
    onError: (_error, _task, context) => {
      if (context?.previous) queryClient.setQueryData(taskKeys.all, context.previous);
      toast.show({ message: SAVE_ERROR });
    },
    onSuccess: (_data, task) => {
      toast.show({
        message: `Đã xoá "${task.title}"`,
        actionLabel: 'Hoàn tác',
        onAction: () => restore.mutate(task),
        durationMs: UNDO_DURATION_MS,
      });
    },
    onSettled: invalidate,
  });
}
```

`src/hooks/useLabels.ts`:
```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { LabelPatch, NewLabel } from '../domain/task';
import { labelKeys, taskKeys } from './queryKeys';
import { useRepositories } from './RepositoryContext';

export function useLabels() {
  const { labels } = useRepositories();
  return useQuery({ queryKey: labelKeys.all, queryFn: () => labels.list() });
}

export function useCreateLabel() {
  const { labels } = useRepositories();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NewLabel) => labels.create(input),
    onSettled: () => queryClient.invalidateQueries({ queryKey: labelKeys.all }),
  });
}

export function useUpdateLabel() {
  const { labels } = useRepositories();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: LabelPatch }) => labels.update(id, patch),
    onSettled: () => queryClient.invalidateQueries({ queryKey: labelKeys.all }),
  });
}

export function useDeleteLabel() {
  const { labels } = useRepositories();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => labels.remove(id),
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: labelKeys.all }),
        queryClient.invalidateQueries({ queryKey: taskKeys.all }),
      ]),
  });
}
```

`src/hooks/useImportData.ts`:
```ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Label, Task } from '../domain/task';
import { labelKeys, taskKeys } from './queryKeys';
import { useRepositories } from './RepositoryContext';

export function useImportData() {
  const repositories = useRepositories();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { tasks: Task[]; labels: Label[] }) => repositories.importData(data),
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: taskKeys.all }),
        queryClient.invalidateQueries({ queryKey: labelKeys.all }),
      ]),
  });
}
```

- [ ] **Step 10: Chạy toàn bộ test**

Run: `npm test`
Expected: PASS toàn bộ.

- [ ] **Step 11: Commit**

```bash
git add src
git commit -m "feat: providers, hook TanStack Query, toast và tuỳ chọn người dùng" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Khung ứng dụng — điều hướng, giao diện sáng/tối, cổng lưu trữ, xử lý lỗi

**Files:**
- Create: `src/lib/theme.ts`, `src/data/probe.ts`, `src/data/index.ts`
- Create: `src/app/Layout.tsx`, `src/app/AppRoutes.tsx`, `src/app/ErrorBoundary.tsx`, `src/app/StorageGate.tsx`
- Create: `src/features/tasks/TasksPage.tsx`, `src/features/report/ReportPage.tsx`, `src/features/settings/SettingsPage.tsx` (bản tạm)
- Modify: `src/App.tsx`, `src/main.tsx`, `src/App.test.tsx`, `src/test/render.tsx`
- Test: `src/app/AppShell.test.tsx`, `src/lib/theme.test.ts`

**Interfaces:**
- Consumes: `AppProviders`, `usePref`, `PREF_KEYS`, `readPref`, `btn` (Task 9); `createDexieRepositories`, `AppDatabase` (Task 7)
- Produces:
  - `theme.ts`: `ThemePref = 'light' | 'dark' | 'system'`, `resolveTheme(pref, prefersDark)`, `applyTheme(pref)`, `useThemeEffect()`
  - `probe.ts`: `probeIndexedDb(): Promise<boolean>`; `data/index.ts`: `createDefaultRepositories(): Repositories`
  - `Layout` (gồm `<Outlet />`), `AppRoutes` (routes `/`, `/bao-cao`, `/cai-dat`), `ErrorBoundary`, `StorageGate({ children: (r) => ReactNode, probe?, createRepositories? })`
  - `test/render.tsx`: thêm `renderApp(repositories, route = '/')` và `LocationProbe` (phần tử `data-testid="location"` chứa pathname + search)

- [ ] **Step 1: Viết test thất bại**

`src/lib/theme.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { applyTheme, resolveTheme } from './theme';

describe('theme', () => {
  it('resolveTheme theo lựa chọn hoặc theo hệ thống', () => {
    expect(resolveTheme('dark', false)).toBe('dark');
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('system', false)).toBe('light');
  });
  it('applyTheme bật / tắt class dark trên <html>', () => {
    applyTheme('dark');
    expect(document.documentElement).toHaveClass('dark');
    applyTheme('light');
    expect(document.documentElement).not.toHaveClass('dark');
  });
});
```

`src/app/AppShell.test.tsx`:
```tsx
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { createTestRepositories, renderApp } from '../test/render';
import { ErrorBoundary } from './ErrorBoundary';
import { StorageGate } from './StorageGate';

describe('khung ứng dụng', () => {
  it('điều hướng giữa các trang', async () => {
    const user = userEvent.setup();
    renderApp(createTestRepositories());
    expect(await screen.findByRole('heading', { level: 1, name: 'Công việc' })).toBeInTheDocument();
    const nav = screen.getByRole('navigation', { name: 'Điều hướng chính' });
    await user.click(within(nav).getByRole('link', { name: 'Báo cáo' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Báo cáo' })).toBeInTheDocument();
    await user.click(within(nav).getByRole('link', { name: 'Cài đặt' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Cài đặt' })).toBeInTheDocument();
  });

  it('đường dẫn lạ quay về trang Công việc', async () => {
    renderApp(createTestRepositories(), '/khong-co');
    expect(await screen.findByRole('heading', { level: 1, name: 'Công việc' })).toBeInTheDocument();
  });
});

describe('StorageGate', () => {
  it('IndexedDB không dùng được thì hiện giải thích', async () => {
    render(<StorageGate probe={async () => false}>{() => <p>ok</p>}</StorageGate>);
    expect(await screen.findByRole('alert')).toHaveTextContent('Không thể lưu dữ liệu');
    expect(screen.queryByText('ok')).not.toBeInTheDocument();
  });
  it('dùng được thì render nội dung với repositories', async () => {
    const repos = createTestRepositories();
    render(
      <StorageGate probe={async () => true} createRepositories={() => repos}>
        {(r) => <p>{r === repos ? 'ok' : 'sai'}</p>}
      </StorageGate>,
    );
    expect(await screen.findByText('ok')).toBeInTheDocument();
  });
});

describe('ErrorBoundary', () => {
  it('lỗi ngoài dự kiến thì hiện màn hình lỗi', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    function Boom(): never {
      throw new Error('boom');
    }
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Đã có lỗi');
    expect(screen.getByRole('button', { name: 'Tải lại' })).toBeInTheDocument();
  });
});
```

Sửa `src/App.test.tsx` (App giờ mở IndexedDB và hiện trang Công việc):
```tsx
import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { App } from './App';

it('mở ứng dụng vào trang Công việc', async () => {
  render(<App />);
  expect(await screen.findByRole('heading', { level: 1, name: 'Công việc' })).toBeInTheDocument();
});
```

Thêm vào cuối `src/test/render.tsx` (và bổ sung import tương ứng ở đầu file):
```tsx
import { render } from '@testing-library/react';
import { useLocation } from 'react-router';
import { AppRoutes } from '../app/AppRoutes';

export function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname + location.search}</div>;
}

export function renderApp(repositories: Repositories, route = '/') {
  return render(
    <AppProviders repositories={repositories} queryClient={createQueryClient()}>
      <MemoryRouter initialEntries={[route]}>
        <AppRoutes />
        <LocationProbe />
      </MemoryRouter>
    </AppProviders>,
  );
}
```

- [ ] **Step 2: Chạy để thấy thất bại**

Run: `npx vitest run src/app src/lib/theme.test.ts src/App.test.tsx`
Expected: FAIL — thiếu `./theme`, `./ErrorBoundary`, `./StorageGate`, `../app/AppRoutes`.

- [ ] **Step 3: Viết theme, probe, data/index**

`src/lib/theme.ts`:
```ts
import { useEffect } from 'react';
import { PREF_KEYS, usePref } from './prefs';

export type ThemePref = 'light' | 'dark' | 'system';

const DARK_QUERY = '(prefers-color-scheme: dark)';

export function resolveTheme(pref: ThemePref, prefersDark: boolean): 'light' | 'dark' {
  if (pref === 'system') return prefersDark ? 'dark' : 'light';
  return pref;
}

export function applyTheme(pref: ThemePref): void {
  const prefersDark = window.matchMedia(DARK_QUERY).matches;
  document.documentElement.classList.toggle('dark', resolveTheme(pref, prefersDark) === 'dark');
}

export function useThemeEffect(): void {
  const [pref] = usePref<ThemePref>(PREF_KEYS.theme, 'system');
  useEffect(() => {
    applyTheme(pref);
    const media = window.matchMedia(DARK_QUERY);
    const onChange = () => applyTheme(pref);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [pref]);
}
```

`src/data/probe.ts`:
```ts
const PROBE_DB = '__cvct_probe__';

/** Kiểm tra trình duyệt có cho mở IndexedDB không (chế độ ẩn danh có thể chặn). */
export function probeIndexedDb(): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      if (typeof indexedDB === 'undefined') return resolve(false);
      const request = indexedDB.open(PROBE_DB);
      request.onsuccess = () => {
        request.result.close();
        indexedDB.deleteDatabase(PROBE_DB);
        resolve(true);
      };
      request.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}
```

`src/data/index.ts`:
```ts
import { createDexieRepositories } from './dexie/createDexieRepositories';
import { AppDatabase } from './dexie/db';
import type { Repositories } from './repository';

/** Nơi duy nhất chọn bản cài đặt lưu trữ. Giai đoạn Supabase: đổi ở đây. */
export function createDefaultRepositories(): Repositories {
  return createDexieRepositories(new AppDatabase());
}
```

- [ ] **Step 4: Viết trang tạm, layout, routes, error boundary, storage gate**

`src/features/tasks/TasksPage.tsx` (bản tạm, Task 11 thay):
```tsx
export function TasksPage() {
  return <h1 className="text-2xl font-bold">Công việc</h1>;
}
```

`src/features/report/ReportPage.tsx` (bản tạm, Task 14 thay):
```tsx
export function ReportPage() {
  return <h1 className="text-2xl font-bold">Báo cáo</h1>;
}
```

`src/features/settings/SettingsPage.tsx` (bản tạm, Task 15 thay):
```tsx
export function SettingsPage() {
  return <h1 className="text-2xl font-bold">Cài đặt</h1>;
}
```

`src/app/Layout.tsx`:
```tsx
import { NavLink, Outlet } from 'react-router';
import { useThemeEffect } from '../lib/theme';

const NAV_ITEMS = [
  { to: '/', label: 'Công việc', icon: '☑️', end: true },
  { to: '/bao-cao', label: 'Báo cáo', icon: '📊', end: false },
  { to: '/cai-dat', label: 'Cài đặt', icon: '⚙️', end: false },
];

function NavItems({ variant }: { variant: 'side' | 'bottom' }) {
  return (
    <>
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            variant === 'side'
              ? `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                }`
              : `flex flex-1 flex-col items-center gap-0.5 py-2 text-xs ${
                  isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'
                }`
          }
        >
          <span aria-hidden="true">{item.icon}</span>
          {item.label}
        </NavLink>
      ))}
    </>
  );
}

export function Layout() {
  useThemeEffect();
  return (
    <div className="min-h-dvh md:flex">
      <aside className="hidden border-r border-slate-200 p-4 dark:border-slate-800 md:block md:w-56 md:shrink-0">
        <p className="mb-6 px-3 text-lg font-bold text-blue-600">Công Việc Của Tôi</p>
        <nav aria-label="Điều hướng chính" className="space-y-1">
          <NavItems variant="side" />
        </nav>
      </aside>
      <main className="min-w-0 flex-1 px-4 pb-24 pt-4 md:px-8 md:pb-10 md:pt-8">
        <p className="mb-3 text-base font-bold text-blue-600 md:hidden">Công Việc Của Tôi</p>
        <Outlet />
      </main>
      <nav
        aria-label="Điều hướng dưới"
        className="fixed inset-x-0 bottom-0 z-30 flex border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] dark:border-slate-800 dark:bg-slate-900 md:hidden"
      >
        <NavItems variant="bottom" />
      </nav>
    </div>
  );
}
```

`src/app/AppRoutes.tsx`:
```tsx
import { Navigate, Route, Routes } from 'react-router';
import { ReportPage } from '../features/report/ReportPage';
import { SettingsPage } from '../features/settings/SettingsPage';
import { TasksPage } from '../features/tasks/TasksPage';
import { Layout } from './Layout';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<TasksPage />} />
        <Route path="bao-cao" element={<ReportPage />} />
        <Route path="cai-dat" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
```

`src/app/ErrorBoundary.tsx`:
```tsx
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { btn } from '../components/ui/styles';

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div role="alert" className="mx-auto mt-24 max-w-md space-y-4 p-6 text-center">
        <h1 className="text-xl font-bold">Đã có lỗi</h1>
        <p className="text-slate-600 dark:text-slate-300">
          Ứng dụng gặp sự cố ngoài dự kiến. Dữ liệu của bạn vẫn được giữ trong trình duyệt.
        </p>
        <button type="button" className={btn.primary} onClick={() => window.location.reload()}>
          Tải lại
        </button>
      </div>
    );
  }
}
```

`src/app/StorageGate.tsx`:
```tsx
import { useEffect, useState, type ReactNode } from 'react';
import { createDefaultRepositories } from '../data';
import { probeIndexedDb } from '../data/probe';
import type { Repositories } from '../data/repository';

type GateState = { kind: 'checking' } | { kind: 'ready'; repositories: Repositories } | { kind: 'unavailable' };

export function StorageGate({
  children,
  probe = probeIndexedDb,
  createRepositories = createDefaultRepositories,
}: {
  children: (repositories: Repositories) => ReactNode;
  probe?: () => Promise<boolean>;
  createRepositories?: () => Repositories;
}) {
  const [state, setState] = useState<GateState>({ kind: 'checking' });

  useEffect(() => {
    let cancelled = false;
    void probe().then((ok) => {
      if (cancelled) return;
      setState(ok ? { kind: 'ready', repositories: createRepositories() } : { kind: 'unavailable' });
    });
    return () => {
      cancelled = true;
    };
  }, [probe, createRepositories]);

  if (state.kind === 'checking') {
    return <p className="p-8 text-center text-slate-500">Đang mở dữ liệu…</p>;
  }
  if (state.kind === 'unavailable') {
    return (
      <div role="alert" className="mx-auto mt-24 max-w-md space-y-3 p-6 text-center">
        <h1 className="text-xl font-bold">Không thể lưu dữ liệu</h1>
        <p className="text-slate-600 dark:text-slate-300">
          Trình duyệt này đang chặn bộ nhớ IndexedDB, thường do chế độ ẩn danh hoặc cài đặt quyền riêng tư.
          Hãy mở ứng dụng trong cửa sổ thường hoặc một trình duyệt khác.
        </p>
      </div>
    );
  }
  return <>{children(state.repositories)}</>;
}
```

`src/App.tsx`:
```tsx
import { BrowserRouter } from 'react-router';
import { AppProviders } from './app/AppProviders';
import { AppRoutes } from './app/AppRoutes';
import { ErrorBoundary } from './app/ErrorBoundary';
import { StorageGate } from './app/StorageGate';

export function App() {
  return (
    <ErrorBoundary>
      <StorageGate>
        {(repositories) => (
          <AppProviders repositories={repositories}>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </AppProviders>
        )}
      </StorageGate>
    </ErrorBoundary>
  );
}
```

`src/main.tsx`:
```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { PREF_KEYS, readPref } from './lib/prefs';
import { applyTheme, type ThemePref } from './lib/theme';
import './index.css';

// Áp giao diện trước khi render để không nháy sáng/tối.
applyTheme(readPref<ThemePref>(PREF_KEYS.theme, 'system'));
// Xin trình duyệt hạn chế tự xoá dữ liệu khi thiếu dung lượng.
void navigator.storage?.persist?.().catch(() => undefined);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [ ] **Step 5: Chạy toàn bộ test**

Run: `npm test`
Expected: PASS toàn bộ.

- [ ] **Step 6: Kiểm tra kiểu và chạy thử**

Run: `npm run build`
Expected: không lỗi.

Run: `npm run dev`, mở `http://localhost:5173`. Kiểm tra thanh bên (≥ 768px) và thanh tab đáy (hẹp hơn), chuyển được giữa 3 trang. Dừng server.

- [ ] **Step 7: Commit**

```bash
git add src
git commit -m "feat(app): khung điều hướng, giao diện sáng/tối, cổng IndexedDB, ErrorBoundary" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Tạo / sửa công việc — hộp thoại, form, thêm nhanh

**Files:**
- Create: `src/components/ui/Dialog.tsx`
- Create: `src/features/tasks/taskForm.ts`, `src/features/tasks/TaskForm.tsx`, `src/features/tasks/TaskDialogHost.tsx`, `src/features/tasks/useTaskDialogParam.ts`, `src/features/tasks/QuickAdd.tsx`
- Modify: `src/features/tasks/TasksPage.tsx` (thay bản tạm), `src/app/Layout.tsx` (thêm `<TaskDialogHost />`)
- Test: `src/features/tasks/taskForm.test.ts`, `src/features/tasks/TaskDialog.test.tsx`

**Interfaces:**
- Consumes: `useTasks`, `useCreateTask`, `useUpdateTasks`, `useLabels` (Task 9); `toDueAt`, `fromDueAt`, `normalizeTitle` (Task 2); `btn`, `field` (Task 9); `renderApp`, `createTestRepositories` (Task 10)
- Produces:
  - `Dialog({ title, onClose, children })`
  - `taskForm.ts`: `TaskFormValues`, `FormErrors`, `toFormValues(task?)`, `validateTaskForm(values): { ok: true; input: TaskInput } | { ok: false; errors: FormErrors }`
  - `useTaskDialogParam()`: `{ dialogTaskId: string | null; openNew(); openTask(id); close() }`, hằng `NEW_TASK = 'new'`. URL `?task=new` mở hộp thoại tạo, `?task=<id>` mở hộp thoại sửa, trên **mọi trang**.
  - `TaskDialogHost` (đặt trong `Layout`), `QuickAdd`
  - `TasksPage` có `h1` "Công việc", nút "+ Thêm", `QuickAdd`, danh sách tạm (mỗi việc là một nút mang tên việc)

- [ ] **Step 1: Viết test thất bại cho phần form thuần**

`src/features/tasks/taskForm.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { toDueAt } from '../../domain/rules';
import { makeTask } from '../../test/factories';
import { toFormValues, validateTaskForm } from './taskForm';

describe('taskForm', () => {
  it('giá trị mặc định cho việc mới', () => {
    expect(toFormValues()).toEqual({
      title: '',
      description: '',
      status: 'todo',
      priority: 'medium',
      dueDate: '',
      dueTime: '',
      labelIds: [],
    });
  });

  it('điền sẵn từ việc có sẵn', () => {
    const task = makeTask({ title: 'A', dueAt: toDueAt('2026-10-20', '09:30'), labelIds: ['l1'] });
    expect(toFormValues(task)).toMatchObject({ title: 'A', dueDate: '2026-10-20', dueTime: '09:30', labelIds: ['l1'] });
  });

  it('báo lỗi tên rỗng và giờ khi chưa chọn ngày', () => {
    const result = validateTaskForm({ ...toFormValues(), title: '  ', dueTime: '09:00' });
    expect(result).toEqual({
      ok: false,
      errors: { title: 'Vui lòng nhập tên công việc', dueTime: 'Chọn ngày trước khi chọn giờ' },
    });
  });

  it('báo lỗi tên quá 200 ký tự', () => {
    const result = validateTaskForm({ ...toFormValues(), title: 'a'.repeat(201) });
    expect(result).toEqual({ ok: false, errors: { title: 'Tên tối đa 200 ký tự' } });
  });

  it('hợp lệ thì trả về dữ liệu đã chuẩn hoá', () => {
    const result = validateTaskForm({
      ...toFormValues(),
      title: '  Viết báo cáo ',
      description: ' chi tiết ',
      priority: 'high',
      dueDate: '2026-10-20',
    });
    expect(result).toEqual({
      ok: true,
      input: {
        title: 'Viết báo cáo',
        description: 'chi tiết',
        status: 'todo',
        priority: 'high',
        dueAt: toDueAt('2026-10-20', ''),
        labelIds: [],
      },
    });
  });
});
```

- [ ] **Step 2: Chạy để thấy thất bại**

Run: `npx vitest run src/features/tasks/taskForm.test.ts`
Expected: FAIL — không tìm thấy module `./taskForm`.

- [ ] **Step 3: Viết `src/features/tasks/taskForm.ts`**

```ts
import { z } from 'zod';
import { fromDueAt, toDueAt } from '../../domain/rules';
import { PRIORITIES, TASK_STATUSES, type Priority, type Task, type TaskInput, type TaskStatus } from '../../domain/task';

export interface TaskFormValues {
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  dueDate: string;
  dueTime: string;
  labelIds: string[];
}

export type FormErrors = Partial<Record<keyof TaskFormValues, string>>;

const taskFormSchema = z
  .object({
    title: z.string().trim().min(1, 'Vui lòng nhập tên công việc').max(200, 'Tên tối đa 200 ký tự'),
    description: z.string(),
    status: z.enum(TASK_STATUSES),
    priority: z.enum(PRIORITIES),
    dueDate: z.string(),
    dueTime: z.string(),
    labelIds: z.array(z.string()),
  })
  .refine((v) => v.dueTime === '' || v.dueDate !== '', {
    message: 'Chọn ngày trước khi chọn giờ',
    path: ['dueTime'],
  });

export function toFormValues(task?: Task): TaskFormValues {
  const { date, time } = fromDueAt(task?.dueAt ?? null);
  return {
    title: task?.title ?? '',
    description: task?.description ?? '',
    status: task?.status ?? 'todo',
    priority: task?.priority ?? 'medium',
    dueDate: date,
    dueTime: time,
    labelIds: task?.labelIds ?? [],
  };
}

export function validateTaskForm(
  values: TaskFormValues,
): { ok: true; input: TaskInput } | { ok: false; errors: FormErrors } {
  const result = taskFormSchema.safeParse(values);
  if (!result.success) {
    const errors: FormErrors = {};
    for (const issue of result.error.issues) {
      const key = issue.path[0] as keyof TaskFormValues;
      errors[key] ??= issue.message;
    }
    return { ok: false, errors };
  }
  const v = result.data;
  return {
    ok: true,
    input: {
      title: v.title,
      description: v.description.trim(),
      status: v.status,
      priority: v.priority,
      dueAt: toDueAt(v.dueDate, v.dueTime),
      labelIds: v.labelIds,
    },
  };
}
```

Run: `npx vitest run src/features/tasks/taskForm.test.ts`
Expected: PASS.

- [ ] **Step 4: Viết test thất bại cho hộp thoại**

`src/features/tasks/TaskDialog.test.tsx`:
```tsx
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { toDueAt } from '../../domain/rules';
import { createTestRepositories, renderApp } from '../../test/render';

describe('tạo / sửa công việc', () => {
  it('thêm nhanh bằng Enter', async () => {
    const user = userEvent.setup();
    const repos = createTestRepositories();
    renderApp(repos);
    await user.type(await screen.findByLabelText('Thêm nhanh công việc'), 'Mua sữa{Enter}');
    expect(await screen.findByRole('button', { name: 'Mua sữa' })).toBeInTheDocument();
    expect(screen.getByLabelText('Thêm nhanh công việc')).toHaveValue('');
    expect((await repos.tasks.list()).map((t) => t.title)).toEqual(['Mua sữa']);
  });

  it('tạo qua hộp thoại, có kiểm tra lỗi', async () => {
    const user = userEvent.setup();
    const repos = createTestRepositories();
    renderApp(repos);
    await user.click(await screen.findByRole('button', { name: '+ Thêm' }));
    const dialog = screen.getByRole('dialog', { name: 'Thêm công việc' });

    await user.click(within(dialog).getByRole('button', { name: 'Thêm' }));
    expect(within(dialog).getByText('Vui lòng nhập tên công việc')).toBeInTheDocument();

    await user.type(within(dialog).getByLabelText('Tên công việc'), 'Viết báo cáo quý');
    await user.selectOptions(within(dialog).getByLabelText('Ưu tiên'), 'high');
    fireEvent.change(within(dialog).getByLabelText('Hạn chót'), { target: { value: '2026-10-20' } });
    await user.click(within(dialog).getByRole('button', { name: 'Thêm' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    const [saved] = await repos.tasks.list();
    expect(saved).toMatchObject({ title: 'Viết báo cáo quý', priority: 'high', dueAt: toDueAt('2026-10-20', '') });
  });

  it('mở ?task=<id> để sửa', async () => {
    const user = userEvent.setup();
    const repos = createTestRepositories();
    const task = await repos.tasks.create({ title: 'Cũ' });
    renderApp(repos, `/?task=${task.id}`);
    const dialog = await screen.findByRole('dialog', { name: 'Sửa công việc' });
    const title = within(dialog).getByLabelText('Tên công việc');
    expect(title).toHaveValue('Cũ');
    await user.clear(title);
    await user.type(title, 'Mới');
    await user.click(within(dialog).getByRole('button', { name: 'Lưu' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect((await repos.tasks.list())[0].title).toBe('Mới');
    expect(screen.getByTestId('location')).toHaveTextContent(/^\/$/);
  });

  it('?task=<id> không tồn tại thì tự đóng', async () => {
    renderApp(createTestRepositories(), '/?task=khong-co');
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent(/^\/$/));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('Escape đóng hộp thoại', async () => {
    const user = userEvent.setup();
    renderApp(createTestRepositories());
    await user.click(await screen.findByRole('button', { name: '+ Thêm' }));
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 5: Chạy để thấy thất bại**

Run: `npx vitest run src/features/tasks/TaskDialog.test.tsx`
Expected: FAIL — không tìm thấy nhãn "Thêm nhanh công việc".

- [ ] **Step 6: Viết Dialog, hook URL, form, host, thêm nhanh, trang**

`src/components/ui/Dialog.tsx`:
```tsx
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    panelRef.current?.querySelector<HTMLElement>('input, textarea, select, button')?.focus();
  }, []);

  return createPortal(
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 md:items-center md:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="max-h-[90dvh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl dark:bg-slate-900 md:max-w-lg md:rounded-2xl"
      >
        <h2 id={titleId} className="mb-4 text-lg font-semibold">
          {title}
        </h2>
        {children}
      </div>
    </div>,
    document.body,
  );
}
```

`src/features/tasks/useTaskDialogParam.ts`:
```ts
import { useCallback } from 'react';
import { useSearchParams } from 'react-router';

export const NEW_TASK = 'new';

export function useTaskDialogParam() {
  const [params, setParams] = useSearchParams();
  const dialogTaskId = params.get('task');

  const setTask = useCallback(
    (value: string | null) =>
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value) next.set('task', value);
          else next.delete('task');
          return next;
        },
        { replace: true },
      ),
    [setParams],
  );

  const openNew = useCallback(() => setTask(NEW_TASK), [setTask]);
  const openTask = useCallback((id: string) => setTask(id), [setTask]);
  const close = useCallback(() => setTask(null), [setTask]);

  return { dialogTaskId, openNew, openTask, close };
}
```

`src/features/tasks/TaskForm.tsx`:
```tsx
import { useId, useState, type FormEvent } from 'react';
import { btn, field } from '../../components/ui/styles';
import {
  PRIORITIES,
  PRIORITY_LABELS,
  STATUS_LABELS,
  TASK_STATUSES,
  type Label,
  type Priority,
  type TaskInput,
  type TaskStatus,
} from '../../domain/task';
import { validateTaskForm, type FormErrors, type TaskFormValues } from './taskForm';

export function TaskForm({
  initial,
  labels,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial: TaskFormValues;
  labels: Label[];
  submitLabel: string;
  onSubmit: (input: TaskInput) => Promise<void>;
  onCancel: () => void;
}) {
  const id = useId();
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof TaskFormValues>(key: K, value: TaskFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  function toggleLabel(labelId: string) {
    set(
      'labelIds',
      values.labelIds.includes(labelId) ? values.labelIds.filter((x) => x !== labelId) : [...values.labelIds, labelId],
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const result = validateTaskForm(values);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      await onSubmit(result.input);
    } catch {
      // Hook đã hiện thông báo lỗi; giữ nguyên nội dung form để người dùng thử lại.
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div>
        <label htmlFor={`${id}-title`} className="mb-1 block text-sm font-medium">
          Tên công việc
        </label>
        <input
          id={`${id}-title`}
          className={field}
          value={values.title}
          onChange={(e) => set('title', e.target.value)}
          aria-invalid={errors.title ? true : undefined}
          aria-describedby={errors.title ? `${id}-title-error` : undefined}
        />
        {errors.title && (
          <p id={`${id}-title-error`} role="alert" className="mt-1 text-sm text-red-600">
            {errors.title}
          </p>
        )}
      </div>

      <div>
        <label htmlFor={`${id}-desc`} className="mb-1 block text-sm font-medium">
          Mô tả
        </label>
        <textarea
          id={`${id}-desc`}
          className={field}
          rows={3}
          value={values.description}
          onChange={(e) => set('description', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor={`${id}-status`} className="mb-1 block text-sm font-medium">
            Trạng thái
          </label>
          <select
            id={`${id}-status`}
            className={field}
            value={values.status}
            onChange={(e) => set('status', e.target.value as TaskStatus)}
          >
            {TASK_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${id}-priority`} className="mb-1 block text-sm font-medium">
            Ưu tiên
          </label>
          <select
            id={`${id}-priority`}
            className={field}
            value={values.priority}
            onChange={(e) => set('priority', e.target.value as Priority)}
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_LABELS[p]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${id}-date`} className="mb-1 block text-sm font-medium">
            Hạn chót
          </label>
          <input
            id={`${id}-date`}
            type="date"
            className={field}
            value={values.dueDate}
            onChange={(e) => {
              set('dueDate', e.target.value);
              if (!e.target.value) set('dueTime', '');
            }}
          />
        </div>
        <div>
          <label htmlFor={`${id}-time`} className="mb-1 block text-sm font-medium">
            Giờ (tuỳ chọn)
          </label>
          <input
            id={`${id}-time`}
            type="time"
            className={field}
            value={values.dueTime}
            disabled={!values.dueDate}
            onChange={(e) => set('dueTime', e.target.value)}
            aria-invalid={errors.dueTime ? true : undefined}
          />
          {errors.dueTime && (
            <p role="alert" className="mt-1 text-sm text-red-600">
              {errors.dueTime}
            </p>
          )}
        </div>
      </div>

      <fieldset>
        <legend className="mb-1 text-sm font-medium">Nhãn</legend>
        {labels.length === 0 ? (
          <p className="text-sm text-slate-500">Chưa có nhãn — tạo trong Cài đặt.</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {labels.map((label) => (
              <label key={label.id} className="flex items-center gap-1 text-sm">
                <input
                  type="checkbox"
                  checked={values.labelIds.includes(label.id)}
                  onChange={() => toggleLabel(label.id)}
                />
                {label.name}
              </label>
            ))}
          </div>
        )}
      </fieldset>

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" className={btn.secondary} onClick={onCancel}>
          Huỷ
        </button>
        <button type="submit" className={btn.primary} disabled={saving}>
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
```

`src/features/tasks/TaskDialogHost.tsx`:
```tsx
import { useEffect } from 'react';
import { Dialog } from '../../components/ui/Dialog';
import { useLabels } from '../../hooks/useLabels';
import { useCreateTask, useTasks, useUpdateTasks } from '../../hooks/useTasks';
import { toFormValues } from './taskForm';
import { TaskForm } from './TaskForm';
import { NEW_TASK, useTaskDialogParam } from './useTaskDialogParam';

export function TaskDialogHost() {
  const { dialogTaskId, close } = useTaskDialogParam();
  const { data: tasks, isSuccess } = useTasks();
  const { data: labels = [] } = useLabels();
  const createTask = useCreateTask();
  const updateTasks = useUpdateTasks();

  const isEdit = dialogTaskId !== null && dialogTaskId !== NEW_TASK;
  const editing = isEdit ? tasks?.find((t) => t.id === dialogTaskId) : undefined;

  useEffect(() => {
    if (isEdit && isSuccess && !editing) close();
  }, [isEdit, isSuccess, editing, close]);

  if (dialogTaskId === NEW_TASK) {
    return (
      <Dialog title="Thêm công việc" onClose={close}>
        <TaskForm
          initial={toFormValues()}
          labels={labels}
          submitLabel="Thêm"
          onCancel={close}
          onSubmit={async (input) => {
            await createTask.mutateAsync(input);
            close();
          }}
        />
      </Dialog>
    );
  }

  if (!editing) return null;

  return (
    <Dialog title="Sửa công việc" onClose={close}>
      <TaskForm
        key={editing.id}
        initial={toFormValues(editing)}
        labels={labels}
        submitLabel="Lưu"
        onCancel={close}
        onSubmit={async (input) => {
          await updateTasks.mutateAsync([{ id: editing.id, patch: input }]);
          close();
        }}
      />
    </Dialog>
  );
}
```

`src/features/tasks/QuickAdd.tsx`:
```tsx
import { useState, type FormEvent } from 'react';
import { field } from '../../components/ui/styles';
import { normalizeTitle } from '../../domain/rules';
import { useCreateTask } from '../../hooks/useTasks';

export function QuickAdd() {
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const createTask = useCreateTask();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const normalized = normalizeTitle(title);
    if (!normalized) {
      setError('Tên tối đa 200 ký tự');
      return;
    }
    setError('');
    createTask.mutate({ title: normalized });
    setTitle('');
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        aria-label="Thêm nhanh công việc"
        placeholder="Thêm nhanh: gõ tên việc rồi nhấn Enter"
        className={field}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      {error && (
        <p role="alert" className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </form>
  );
}
```

`src/features/tasks/TasksPage.tsx` (thay bản tạm; Task 12 sẽ thay tiếp):
```tsx
import { btn } from '../../components/ui/styles';
import { useTasks } from '../../hooks/useTasks';
import { QuickAdd } from './QuickAdd';
import { useTaskDialogParam } from './useTaskDialogParam';

export function TasksPage() {
  const { data: tasks = [] } = useTasks();
  const { openNew, openTask } = useTaskDialogParam();
  return (
    <section className="mx-auto max-w-4xl space-y-4">
      <header className="flex items-center gap-3">
        <h1 className="mr-auto text-2xl font-bold">Công việc</h1>
        <button type="button" className={btn.primary} onClick={openNew}>
          + Thêm
        </button>
      </header>
      <QuickAdd />
      <ul className="space-y-2">
        {tasks.map((t) => (
          <li key={t.id}>
            <button type="button" onClick={() => openTask(t.id)}>
              {t.title}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

`src/app/Layout.tsx`: thêm `import { TaskDialogHost } from '../features/tasks/TaskDialogHost';` và đặt `<TaskDialogHost />` ngay trước thẻ đóng `</div>` ngoài cùng (sau `<nav aria-label="Điều hướng dưới">…</nav>`).

- [ ] **Step 7: Chạy toàn bộ test**

Run: `npm test`
Expected: PASS toàn bộ.

- [ ] **Step 8: Commit**

```bash
git add src
git commit -m "feat(tasks): hộp thoại tạo / sửa công việc qua URL và ô thêm nhanh" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 12: Trang Công việc dạng danh sách — lọc, tìm kiếm, sắp xếp, đổi trạng thái, xoá

**Files:**
- Create: `src/lib/format.ts`, `src/lib/useNow.ts`, `src/lib/keyboard.ts`, `src/lib/labelColors.ts`
- Create: `src/features/tasks/useTaskUrlState.ts`, `src/features/tasks/StatusFilterBar.tsx`, `src/features/tasks/badges.tsx`, `src/features/tasks/TaskRow.tsx`, `src/features/tasks/EmptyState.tsx`
- Modify: `src/features/tasks/TasksPage.tsx` (viết lại toàn bộ)
- Test: `src/lib/format.test.ts`, `src/features/tasks/TasksPage.test.tsx`

**Interfaces:**
- Consumes: `searchTasks`, `filterByStatus`, `countByStatus`, `sortTasks`, `parseStatusFilter`, `parseSortKey`, `StatusFilter`, `SortKey` (Task 3); `isOverdue`, `isDueSoon` (Task 2); `useUpdateTasks`, `useDeleteTask`, `useLabels` (Task 9); `useTaskDialogParam`, `QuickAdd` (Task 11)
- Produces:
  - `format.ts`: `formatDueLabel(dueAt, now)`, `formatDateTime(iso)`
  - `useNow(intervalMs = 60000): Date`
  - `keyboard.ts`: `isTypingTarget(target)`, `useNewTaskShortcut(onTrigger)`
  - `labelColors.ts`: `LABEL_COLOR_CLASSES: Record<LabelColor, string>`, `LABEL_COLOR_NAMES: Record<LabelColor, string>`
  - `useTaskUrlState()`: `{ status, q, sort, setStatus, setQuery, setSort, clearFilters }`
  - `badges.tsx`: `PriorityBadge({ priority })`, `DueBadge({ task, now })`, `LabelChips({ labelIds, labelsById })`
  - `TaskRow({ task, labelsById, now })`, `StatusFilterBar({ value, counts, onChange })`, `EmptyState({ title, actionLabel, onAction })`

- [ ] **Step 1: Viết test thất bại cho định dạng hạn chót**

`src/lib/format.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { formatDateTime, formatDueLabel } from './format';

const now = new Date(2026, 9, 16, 10, 0);
const at = (d: number, h = 23, m = 59) => new Date(2026, 9, d, h, m).toISOString();

describe('formatDueLabel', () => {
  it('hôm nay / ngày mai / hôm qua, có giờ nếu không phải 23:59', () => {
    expect(formatDueLabel(at(16), now)).toBe('Hôm nay');
    expect(formatDueLabel(at(16, 15, 30), now)).toBe('Hôm nay 15:30');
    expect(formatDueLabel(at(17), now)).toBe('Ngày mai');
    expect(formatDueLabel(at(15, 8, 0), now)).toBe('Hôm qua 08:00');
  });
  it('còn N ngày / trễ N ngày', () => {
    expect(formatDueLabel(at(18), now)).toBe('Còn 2 ngày');
    expect(formatDueLabel(at(13), now)).toBe('Trễ 3 ngày');
  });
  it('formatDateTime đầy đủ', () => {
    expect(formatDateTime(at(20, 9, 5))).toBe('20/10/2026 09:05');
  });
});
```

Run: `npx vitest run src/lib/format.test.ts`
Expected: FAIL — không tìm thấy module `./format`.

- [ ] **Step 2: Viết tiện ích**

`src/lib/format.ts`:
```ts
import { differenceInCalendarDays, format } from 'date-fns';

export function formatDueLabel(dueAt: string, now: Date): string {
  const due = new Date(dueAt);
  const days = differenceInCalendarDays(due, now);
  const hasTime = !(due.getHours() === 23 && due.getMinutes() === 59);
  const time = hasTime ? ` ${format(due, 'HH:mm')}` : '';
  if (days === 0) return `Hôm nay${time}`;
  if (days === 1) return `Ngày mai${time}`;
  if (days === -1) return `Hôm qua${time}`;
  if (days > 1) return `Còn ${days} ngày`;
  return `Trễ ${-days} ngày`;
}

export function formatDateTime(iso: string): string {
  return format(new Date(iso), 'dd/MM/yyyy HH:mm');
}
```

`src/lib/useNow.ts`:
```ts
import { useEffect, useState } from 'react';

/** Thời điểm hiện tại, tự cập nhật mỗi `intervalMs` để màu trễ hạn luôn đúng. */
export function useNow(intervalMs = 60_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}
```

`src/lib/keyboard.ts`:
```ts
import { useEffect } from 'react';

export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

/** Phím N mở hộp thoại thêm việc, trừ khi đang gõ hoặc đang mở hộp thoại khác. */
export function useNewTaskShortcut(onTrigger: () => void): void {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== 'n' || e.ctrlKey || e.metaKey || e.altKey) return;
      if (isTypingTarget(e.target) || document.querySelector('[role="dialog"]')) return;
      e.preventDefault();
      onTrigger();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onTrigger]);
}
```

`src/lib/labelColors.ts` (viết đầy đủ tên class để Tailwind nhận diện):
```ts
import type { LabelColor } from '../domain/task';

export const LABEL_COLOR_CLASSES: Record<LabelColor, string> = {
  slate: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  red: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  amber: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  green: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  teal: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  violet: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  pink: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
};

export const LABEL_COLOR_NAMES: Record<LabelColor, string> = {
  slate: 'Xám',
  red: 'Đỏ',
  orange: 'Cam',
  amber: 'Vàng',
  green: 'Xanh lá',
  teal: 'Xanh ngọc',
  blue: 'Xanh dương',
  violet: 'Tím',
  pink: 'Hồng',
};
```

Run: `npx vitest run src/lib/format.test.ts`
Expected: PASS.

- [ ] **Step 3: Viết test thất bại cho trang**

`src/features/tasks/TasksPage.test.tsx`:
```tsx
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { Repositories } from '../../data/repository';
import { createTestRepositories, renderApp } from '../../test/render';

async function seed(repos: Repositories) {
  await repos.tasks.create({ title: 'Viết báo cáo quý', priority: 'low' });
  await repos.tasks.create({ title: 'Mua sữa', status: 'in_progress', priority: 'high' });
  await repos.tasks.create({ title: 'Gọi điện cho mẹ', priority: 'medium' });
}

function rowTitles(): string[] {
  const list = screen.getByRole('list', { name: 'Danh sách công việc' });
  return within(list)
    .getAllByRole('listitem')
    .map((li) => within(li).getAllByRole('button')[0].textContent ?? '');
}

describe('trang Công việc', () => {
  it('lọc theo trạng thái, có đếm số và ghi lên URL', async () => {
    const user = userEvent.setup();
    const repos = createTestRepositories();
    await seed(repos);
    renderApp(repos);
    const filters = await screen.findByRole('group', { name: 'Lọc theo trạng thái' });
    await waitFor(() => expect(within(filters).getByRole('button', { name: 'Tất cả 3' })).toBeInTheDocument());
    await user.click(within(filters).getByRole('button', { name: 'Đang làm 1' }));
    expect(rowTitles()).toEqual(['Mua sữa']);
    expect(screen.getByTestId('location')).toHaveTextContent('/?status=in_progress');
  });

  it('tìm kiếm không dấu', async () => {
    const user = userEvent.setup();
    const repos = createTestRepositories();
    await seed(repos);
    renderApp(repos);
    await screen.findByRole('button', { name: 'Mua sữa' });
    await user.type(screen.getByLabelText('Tìm công việc'), 'bao cao');
    await waitFor(() => expect(rowTitles()).toEqual(['Viết báo cáo quý']));
  });

  it('đọc từ khoá và kiểu sắp xếp từ URL', async () => {
    const repos = createTestRepositories();
    await seed(repos);
    renderApp(repos, '/?q=sua');
    expect(await screen.findByRole('button', { name: 'Mua sữa' })).toBeInTheDocument();
    expect(screen.getByLabelText('Tìm công việc')).toHaveValue('sua');
    expect(rowTitles()).toEqual(['Mua sữa']);
  });

  it('sắp xếp theo ưu tiên', async () => {
    const user = userEvent.setup();
    const repos = createTestRepositories();
    await seed(repos);
    renderApp(repos);
    await screen.findByRole('button', { name: 'Mua sữa' });
    await user.selectOptions(screen.getByLabelText('Sắp xếp'), 'priority');
    expect(rowTitles()).toEqual(['Mua sữa', 'Gọi điện cho mẹ', 'Viết báo cáo quý']);
  });

  it('tích ô để đánh dấu Đã xong; menu đổi trạng thái', async () => {
    const user = userEvent.setup();
    const repos = createTestRepositories();
    await seed(repos);
    renderApp(repos);
    await user.click(await screen.findByLabelText('Đánh dấu "Mua sữa" đã xong'));
    await waitFor(() => expect(screen.getByLabelText('Trạng thái của "Mua sữa"')).toHaveValue('done'));
    await user.selectOptions(screen.getByLabelText('Trạng thái của "Gọi điện cho mẹ"'), 'on_hold');
    await waitFor(async () => {
      const saved = await repos.tasks.list();
      expect(saved.find((t) => t.title === 'Mua sữa')?.status).toBe('done');
      expect(saved.find((t) => t.title === 'Gọi điện cho mẹ')?.status).toBe('on_hold');
    });
  });

  it('xoá qua menu ⋯ rồi hoàn tác', async () => {
    const user = userEvent.setup();
    const repos = createTestRepositories();
    await seed(repos);
    renderApp(repos);
    await user.click(await screen.findByRole('button', { name: 'Thao tác khác cho "Mua sữa"' }));
    await user.click(screen.getByRole('menuitem', { name: 'Xoá' }));
    expect(await screen.findByText('Đã xoá "Mua sữa"')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Mua sữa' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Hoàn tác' }));
    expect(await screen.findByRole('button', { name: 'Mua sữa' })).toBeInTheDocument();
  });

  it('trạng thái trống và phím N', async () => {
    const user = userEvent.setup();
    renderApp(createTestRepositories());
    expect(await screen.findByText('Chưa có công việc nào')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Thêm việc đầu tiên' }));
    expect(screen.getByRole('dialog', { name: 'Thêm công việc' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    await user.keyboard('n');
    expect(screen.getByRole('dialog', { name: 'Thêm công việc' })).toBeInTheDocument();
  });

  it('lọc không ra kết quả thì có nút Xoá bộ lọc', async () => {
    const user = userEvent.setup();
    const repos = createTestRepositories();
    await seed(repos);
    renderApp(repos, '/?status=done&q=abc');
    await user.click(await screen.findByRole('button', { name: 'Xoá bộ lọc' }));
    await waitFor(() => expect(rowTitles()).toHaveLength(3));
    expect(screen.getByLabelText('Tìm công việc')).toHaveValue('');
    expect(screen.getByTestId('location')).toHaveTextContent(/^\/$/);
  });
});
```

Run: `npx vitest run src/features/tasks/TasksPage.test.tsx`
Expected: FAIL — không tìm thấy nhóm "Lọc theo trạng thái".

- [ ] **Step 4: Viết hook URL và các thành phần**

`src/features/tasks/useTaskUrlState.ts`:
```ts
import { useCallback } from 'react';
import { useSearchParams } from 'react-router';
import { parseSortKey, parseStatusFilter, type SortKey, type StatusFilter } from '../../domain/query';

interface UrlChanges {
  status?: StatusFilter;
  q?: string;
  sort?: SortKey;
}

export function useTaskUrlState() {
  const [params, setParams] = useSearchParams();
  const status = parseStatusFilter(params.get('status'));
  const q = params.get('q') ?? '';
  const sort = parseSortKey(params.get('sort'));

  const update = useCallback(
    (changes: UrlChanges) =>
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (changes.status !== undefined) {
            if (changes.status === 'all') next.delete('status');
            else next.set('status', changes.status);
          }
          if (changes.q !== undefined) {
            if (changes.q.trim() === '') next.delete('q');
            else next.set('q', changes.q);
          }
          if (changes.sort !== undefined) {
            if (changes.sort === 'due') next.delete('sort');
            else next.set('sort', changes.sort);
          }
          return next;
        },
        { replace: true },
      ),
    [setParams],
  );

  return {
    status,
    q,
    sort,
    setStatus: (value: StatusFilter) => update({ status: value }),
    setQuery: (value: string) => update({ q: value }),
    setSort: (value: SortKey) => update({ sort: value }),
    clearFilters: () => update({ status: 'all', q: '' }),
  };
}
```

`src/features/tasks/StatusFilterBar.tsx`:
```tsx
import type { StatusFilter } from '../../domain/query';
import { STATUS_LABELS, TASK_STATUSES } from '../../domain/task';

const OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  ...TASK_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] })),
];

export function StatusFilterBar({
  value,
  counts,
  onChange,
}: {
  value: StatusFilter;
  counts: Record<StatusFilter, number>;
  onChange: (value: StatusFilter) => void;
}) {
  return (
    <div role="group" aria-label="Lọc theo trạng thái" className="flex flex-wrap gap-2">
      {OPTIONS.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={`rounded-full border px-3 py-1 text-sm ${
              active
                ? 'border-blue-600 bg-blue-600 text-white'
                : 'border-slate-300 bg-white hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800'
            }`}
          >
            {option.label} {counts[option.value]}
          </button>
        );
      })}
    </div>
  );
}
```

`src/features/tasks/badges.tsx`:
```tsx
import { isDueSoon, isOverdue } from '../../domain/rules';
import { PRIORITY_LABELS, type Label, type Priority, type Task } from '../../domain/task';
import { formatDateTime, formatDueLabel } from '../../lib/format';
import { LABEL_COLOR_CLASSES } from '../../lib/labelColors';

const PRIORITY_CLASSES: Record<Priority, string> = {
  high: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  low: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return <span className={`rounded-full px-2 py-0.5 ${PRIORITY_CLASSES[priority]}`}>{PRIORITY_LABELS[priority]}</span>;
}

export function DueBadge({ task, now }: { task: Task; now: Date }) {
  if (!task.dueAt) return null;
  const tone = isOverdue(task, now)
    ? 'font-semibold text-red-600 dark:text-red-400'
    : isDueSoon(task, now)
      ? 'text-orange-600 dark:text-orange-400'
      : 'text-slate-500';
  return (
    <span className={tone} title={formatDateTime(task.dueAt)}>
      ⏰ {formatDueLabel(task.dueAt, now)}
    </span>
  );
}

export function LabelChips({ labelIds, labelsById }: { labelIds: string[]; labelsById: Map<string, Label> }) {
  const labels = labelIds.map((id) => labelsById.get(id)).filter((l): l is Label => l !== undefined);
  return (
    <>
      {labels.map((label) => (
        <span key={label.id} className={`rounded-full px-2 py-0.5 ${LABEL_COLOR_CLASSES[label.color]}`}>
          #{label.name}
        </span>
      ))}
    </>
  );
}
```

`src/features/tasks/EmptyState.tsx`:
```tsx
import { btn } from '../../components/ui/styles';

export function EmptyState({ title, actionLabel, onAction }: { title: string; actionLabel: string; onAction: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center dark:border-slate-700">
      <p className="mb-4 text-slate-500">{title}</p>
      <button type="button" className={btn.primary} onClick={onAction}>
        {actionLabel}
      </button>
    </div>
  );
}
```

`src/features/tasks/TaskRow.tsx`:
```tsx
import { useEffect, useRef, useState } from 'react';
import { btn, field } from '../../components/ui/styles';
import { STATUS_LABELS, TASK_STATUSES, type Label, type Task, type TaskStatus } from '../../domain/task';
import { useDeleteTask, useUpdateTasks } from '../../hooks/useTasks';
import { DueBadge, LabelChips, PriorityBadge } from './badges';
import { useTaskDialogParam } from './useTaskDialogParam';

function RowMenu({ title, onEdit, onDelete }: { title: string; onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        className={btn.ghost}
        aria-label={`Thao tác khác cho "${title}"`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        ⋯
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-10 mt-1 w-32 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900"
        >
          <button
            type="button"
            role="menuitem"
            className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
          >
            Sửa
          </button>
          <button
            type="button"
            role="menuitem"
            className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
          >
            Xoá
          </button>
        </div>
      )}
    </div>
  );
}

export function TaskRow({ task, labelsById, now }: { task: Task; labelsById: Map<string, Label>; now: Date }) {
  const updateTasks = useUpdateTasks();
  const deleteTask = useDeleteTask();
  const { openTask } = useTaskDialogParam();
  const setStatus = (status: TaskStatus) => updateTasks.mutate([{ id: task.id, patch: { status } }]);
  const done = task.status === 'done';

  return (
    <li className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
      <input
        type="checkbox"
        className="size-5 accent-blue-600"
        aria-label={`Đánh dấu "${task.title}" đã xong`}
        checked={done}
        onChange={(e) => setStatus(e.target.checked ? 'done' : 'todo')}
      />
      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={() => openTask(task.id)}
          className={`text-left font-medium hover:underline ${done ? 'text-slate-400 line-through' : ''}`}
        >
          {task.title}
        </button>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
          <LabelChips labelIds={task.labelIds} labelsById={labelsById} />
          <PriorityBadge priority={task.priority} />
          <DueBadge task={task} now={now} />
        </div>
      </div>
      <select
        aria-label={`Trạng thái của "${task.title}"`}
        className={`${field} w-auto`}
        value={task.status}
        onChange={(e) => setStatus(e.target.value as TaskStatus)}
      >
        {TASK_STATUSES.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABELS[s]}
          </option>
        ))}
      </select>
      <RowMenu title={task.title} onEdit={() => openTask(task.id)} onDelete={() => deleteTask.mutate(task)} />
    </li>
  );
}
```

`src/features/tasks/TasksPage.tsx` (viết lại toàn bộ):
```tsx
import { useId, useMemo, useRef } from 'react';
import { btn, field } from '../../components/ui/styles';
import { countByStatus, filterByStatus, searchTasks, sortTasks, type SortKey } from '../../domain/query';
import { useLabels } from '../../hooks/useLabels';
import { useTasks } from '../../hooks/useTasks';
import { useNewTaskShortcut } from '../../lib/keyboard';
import { useNow } from '../../lib/useNow';
import { EmptyState } from './EmptyState';
import { QuickAdd } from './QuickAdd';
import { StatusFilterBar } from './StatusFilterBar';
import { TaskRow } from './TaskRow';
import { useTaskDialogParam } from './useTaskDialogParam';
import { useTaskUrlState } from './useTaskUrlState';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'due', label: 'Hạn chót' },
  { value: 'priority', label: 'Ưu tiên' },
  { value: 'created', label: 'Ngày tạo' },
];

export function TasksPage() {
  const sortId = useId();
  const { data: tasks = [], isPending } = useTasks();
  const { data: labels = [] } = useLabels();
  const { status, q, sort, setStatus, setQuery, setSort, clearFilters } = useTaskUrlState();
  const { openNew } = useTaskDialogParam();
  // Ô tìm kiếm không điều khiển (uncontrolled) để gõ nhanh không mất ký tự khi URL cập nhật trễ.
  const searchRef = useRef<HTMLInputElement>(null);
  const now = useNow();
  useNewTaskShortcut(openNew);

  const searched = useMemo(() => searchTasks(tasks, q), [tasks, q]);
  const counts = useMemo(() => countByStatus(searched), [searched]);
  const visible = useMemo(() => sortTasks(filterByStatus(searched, status), sort), [searched, status, sort]);
  const labelsById = useMemo(() => new Map(labels.map((l) => [l.id, l])), [labels]);

  function handleClear() {
    clearFilters();
    if (searchRef.current) searchRef.current.value = '';
  }

  return (
    <section className="mx-auto max-w-4xl space-y-4">
      <header className="flex flex-wrap items-center gap-3">
        <h1 className="mr-auto text-2xl font-bold">Công việc</h1>
        <input
          ref={searchRef}
          type="search"
          aria-label="Tìm công việc"
          placeholder="Tìm việc..."
          className={`${field} w-full sm:w-56`}
          defaultValue={q}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="button" className={btn.primary} onClick={openNew}>
          + Thêm
        </button>
      </header>

      <StatusFilterBar value={status} counts={counts} onChange={setStatus} />

      <div className="flex items-center gap-2 text-sm">
        <label htmlFor={sortId}>Sắp xếp</label>
        <select
          id={sortId}
          className={`${field} w-auto`}
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <QuickAdd />

      {isPending ? (
        <p className="text-slate-500">Đang tải…</p>
      ) : tasks.length === 0 ? (
        <EmptyState title="Chưa có công việc nào" actionLabel="Thêm việc đầu tiên" onAction={openNew} />
      ) : visible.length === 0 ? (
        <EmptyState title="Không có việc nào khớp bộ lọc" actionLabel="Xoá bộ lọc" onAction={handleClear} />
      ) : (
        <ul aria-label="Danh sách công việc" className="space-y-2">
          {visible.map((task) => (
            <TaskRow key={task.id} task={task} labelsById={labelsById} now={now} />
          ))}
        </ul>
      )}
    </section>
  );
}
```

- [ ] **Step 5: Chạy toàn bộ test**

Run: `npm test`
Expected: PASS toàn bộ (kể cả `TaskDialog.test.tsx` của Task 11).

- [ ] **Step 6: Commit**

```bash
git add src
git commit -m "feat(tasks): danh sách với lọc trạng thái, tìm không dấu, sắp xếp, xoá có hoàn tác" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 13: Bảng Kanban kéo thả và nút chuyển chế độ xem

**Files:**
- Create: `src/features/tasks/KanbanBoard.tsx`
- Modify: `src/features/tasks/TasksPage.tsx`
- Test: `src/features/tasks/KanbanBoard.test.tsx`

**Interfaces:**
- Consumes: `computeDrop`, `sortByPosition` (Task 4); `KANBAN_COLUMNS`, `STATUS_LABELS` (Task 2); `useUpdateTasks` (Task 9); `usePref`, `PREF_KEYS` (Task 9); badges (Task 12); `useTaskDialogParam` (Task 11)
- Produces: `KanbanBoard({ allTasks, visibleTasks, statuses, labelsById, now })`; TasksPage có nhóm nút "Chế độ xem" gồm "Danh sách" và "Kanban" (`aria-pressed`), lưu lựa chọn vào `cvct.view`.

- [ ] **Step 1: Viết test thất bại**

`src/features/tasks/KanbanBoard.test.tsx`:
```tsx
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { Repositories } from '../../data/repository';
import { createTestRepositories, renderApp } from '../../test/render';

async function seed(repos: Repositories) {
  await repos.tasks.create({ title: 'Viết báo cáo quý' });
  await repos.tasks.create({ title: 'Mua sữa', status: 'in_progress' });
  await repos.tasks.create({ title: 'Gọi điện cho mẹ', status: 'done' });
}

const columnTitles = () => screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);

describe('Kanban', () => {
  it('chuyển sang Kanban, hiện 4 cột đúng thứ tự và nhớ lựa chọn', async () => {
    const user = userEvent.setup();
    const repos = createTestRepositories();
    await seed(repos);
    renderApp(repos);
    await screen.findByRole('button', { name: 'Mua sữa' });
    await user.click(screen.getByRole('button', { name: 'Kanban' }));
    expect(columnTitles()).toEqual(['Cần làm', 'Đang làm', 'Tạm hoãn', 'Đã xong']);
    const doing = screen.getByRole('region', { name: 'Đang làm' });
    expect(within(doing).getByRole('button', { name: 'Mua sữa' })).toBeInTheDocument();
    expect(localStorage.getItem('cvct.view')).toBe('"kanban"');
    expect(screen.queryByLabelText('Sắp xếp')).not.toBeInTheDocument();
  });

  it('bộ lọc trạng thái ẩn các cột khác; tìm kiếm lọc thẻ', async () => {
    const user = userEvent.setup();
    localStorage.setItem('cvct.view', '"kanban"');
    const repos = createTestRepositories();
    await seed(repos);
    renderApp(repos, '/?status=done');
    await screen.findByRole('button', { name: 'Gọi điện cho mẹ' });
    expect(columnTitles()).toEqual(['Đã xong']);
    await user.click(screen.getByRole('button', { name: /^Tất cả/ }));
    await user.type(screen.getByLabelText('Tìm công việc'), 'sua');
    expect(await screen.findByRole('button', { name: 'Mua sữa' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Viết báo cáo quý' })).not.toBeInTheDocument();
  });
});
```

Run: `npx vitest run src/features/tasks/KanbanBoard.test.tsx`
Expected: FAIL — không tìm thấy nút "Kanban".

- [ ] **Step 2: Viết `src/features/tasks/KanbanBoard.tsx`**

```tsx
import {
  closestCorners,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useId } from 'react';
import { computeDrop, sortByPosition } from '../../domain/kanban';
import { STATUS_LABELS, type Label, type Task, type TaskStatus } from '../../domain/task';
import { useUpdateTasks } from '../../hooks/useTasks';
import { DueBadge, LabelChips, PriorityBadge } from './badges';
import { useTaskDialogParam } from './useTaskDialogParam';

const COLUMN_PREFIX = 'column:';

interface CardProps {
  task: Task;
  labelsById: Map<string, Label>;
  now: Date;
}

function KanbanCard({ task, labelsById, now }: CardProps) {
  const { openTask } = useTaskDialogParam();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className={`cursor-grab rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800 ${
        isDragging ? 'opacity-60' : ''
      }`}
    >
      <button type="button" onClick={() => openTask(task.id)} className="text-left font-medium hover:underline">
        {task.title}
      </button>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
        <LabelChips labelIds={task.labelIds} labelsById={labelsById} />
        <PriorityBadge priority={task.priority} />
        <DueBadge task={task} now={now} />
      </div>
    </li>
  );
}

function KanbanColumn({
  status,
  tasks,
  labelsById,
  now,
}: {
  status: TaskStatus;
  tasks: Task[];
  labelsById: Map<string, Label>;
  now: Date;
}) {
  const headingId = useId();
  const { setNodeRef, isOver } = useDroppable({ id: `${COLUMN_PREFIX}${status}` });
  return (
    <section
      aria-labelledby={headingId}
      className={`rounded-2xl bg-slate-100 p-3 dark:bg-slate-900 ${isOver ? 'ring-2 ring-blue-400' : ''}`}
    >
      <header className="mb-3 flex items-center justify-between">
        <h2 id={headingId} className="font-semibold">
          {STATUS_LABELS[status]}
        </h2>
        <span className="text-sm text-slate-500" aria-label={`${tasks.length} việc`}>
          {tasks.length}
        </span>
      </header>
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <ul ref={setNodeRef} className="min-h-24 space-y-2">
          {tasks.map((task) => (
            <KanbanCard key={task.id} task={task} labelsById={labelsById} now={now} />
          ))}
        </ul>
      </SortableContext>
    </section>
  );
}

export function KanbanBoard({
  allTasks,
  visibleTasks,
  statuses,
  labelsById,
  now,
}: {
  allTasks: Task[];
  visibleTasks: Task[];
  statuses: TaskStatus[];
  labelsById: Map<string, Label>;
  now: Date;
}) {
  const updateTasks = useUpdateTasks();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const overId = String(over.id);
    let targetStatus: TaskStatus;
    let overTaskId: string | null;
    if (overId.startsWith(COLUMN_PREFIX)) {
      targetStatus = overId.slice(COLUMN_PREFIX.length) as TaskStatus;
      overTaskId = null;
    } else {
      const overTask = allTasks.find((t) => t.id === overId);
      if (!overTask) return;
      targetStatus = overTask.status;
      overTaskId = overTask.id;
    }
    // Tính trên toàn bộ việc (không chỉ việc đang hiện) để position không bị trùng.
    const updates = computeDrop(allTasks, String(active.id), targetStatus, overTaskId);
    if (updates.length > 0) updateTasks.mutate(updates);
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statuses.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            tasks={sortByPosition(visibleTasks.filter((t) => t.status === status))}
            labelsById={labelsById}
            now={now}
          />
        ))}
      </div>
    </DndContext>
  );
}
```

- [ ] **Step 3: Thêm chế độ xem vào `TasksPage.tsx`**

Thêm import:
```tsx
import { KANBAN_COLUMNS } from '../../domain/task';
import { PREF_KEYS, usePref } from '../../lib/prefs';
import { KanbanBoard } from './KanbanBoard';
```

Thêm trong thân `TasksPage`, ngay sau dòng `const { openNew } = useTaskDialogParam();`:
```tsx
  const [storedView, setView] = usePref<string>(PREF_KEYS.view, 'list');
  const view: 'list' | 'kanban' = storedView === 'kanban' ? 'kanban' : 'list';
```

Thêm ngay sau dòng `const labelsById = …`:
```tsx
  const noMatches = view === 'list' ? visible.length === 0 : searched.length === 0;
```

Thay khối `<div className="flex items-center gap-2 text-sm">…</div>` (ô Sắp xếp) bằng:
```tsx
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <div role="group" aria-label="Chế độ xem" className="inline-flex overflow-hidden rounded-lg border border-slate-300 dark:border-slate-700">
          {(['list', 'kanban'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              aria-pressed={view === mode}
              onClick={() => setView(mode)}
              className={`px-3 py-1.5 ${view === mode ? 'bg-blue-600 text-white' : 'bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800'}`}
            >
              {mode === 'list' ? 'Danh sách' : 'Kanban'}
            </button>
          ))}
        </div>
        {view === 'list' && (
          <>
            <label htmlFor={sortId}>Sắp xếp</label>
            <select
              id={sortId}
              className={`${field} w-auto`}
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </>
        )}
      </div>
```

Thay khối hiển thị kết quả (từ `{isPending ? (` đến hết biểu thức) bằng:
```tsx
      {isPending ? (
        <p className="text-slate-500">Đang tải…</p>
      ) : tasks.length === 0 ? (
        <EmptyState title="Chưa có công việc nào" actionLabel="Thêm việc đầu tiên" onAction={openNew} />
      ) : noMatches ? (
        <EmptyState title="Không có việc nào khớp bộ lọc" actionLabel="Xoá bộ lọc" onAction={handleClear} />
      ) : view === 'kanban' ? (
        <KanbanBoard
          allTasks={tasks}
          visibleTasks={searched}
          statuses={status === 'all' ? KANBAN_COLUMNS : [status]}
          labelsById={labelsById}
          now={now}
        />
      ) : (
        <ul aria-label="Danh sách công việc" className="space-y-2">
          {visible.map((task) => (
            <TaskRow key={task.id} task={task} labelsById={labelsById} now={now} />
          ))}
        </ul>
      )}
```

Lưu ý: test Task 12 bấm nút có tên `Tất cả 3`; nút "Danh sách" / "Kanban" không trùng tên với nút nào khác.

- [ ] **Step 4: Chạy toàn bộ test**

Run: `npm test`
Expected: PASS toàn bộ.

- [ ] **Step 5: Thử kéo thả bằng tay**

Run: `npm run dev`. Tạo 3 việc, chuyển sang Kanban:
- Kéo một thẻ sang cột "Đang làm" → thẻ ở cột mới, tải lại trang vẫn giữ.
- Kéo đổi thứ tự trong cùng cột → tải lại vẫn giữ thứ tự.
- Bấm vào tên thẻ (không kéo) → mở hộp thoại sửa.

Dừng server.

- [ ] **Step 6: Commit**

```bash
git add src
git commit -m "feat(tasks): bảng Kanban kéo thả và chuyển chế độ xem" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 14: Trang Báo cáo

**Files:**
- Modify: `src/features/report/ReportPage.tsx` (viết lại toàn bộ)
- Test: `src/features/report/ReportPage.test.tsx`

**Interfaces:**
- Consumes: `summarize`, `completionsByDay`, `completionsByWeek`, `overdueTasks`, `dueSoonTasks` (Task 5); `useTasks` (Task 9); `useNow`, `formatDueLabel` (Task 12); `useTaskDialogParam` (Task 11); `card`, `btn` (Task 9)
- Produces: trang `/bao-cao` gồm 4 thẻ số liệu (`role="group"` với tên "Tổng", "Đang làm", "Đã xong", "Tỉ lệ hoàn thành"), biểu đồ tròn, biểu đồ cột có nút "7 ngày" / "8 tuần", danh sách "Trễ hạn" và "Sắp đến hạn" (bấm mở hộp thoại sửa)

- [ ] **Step 1: Viết test thất bại**

`src/features/report/ReportPage.test.tsx`:
```tsx
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { createTestRepositories, renderApp } from '../../test/render';

const hoursFromNow = (h: number) => new Date(Date.now() + h * 3_600_000).toISOString();

describe('trang Báo cáo', () => {
  it('hiện số liệu tổng quan', async () => {
    const repos = createTestRepositories();
    await repos.tasks.create({ title: 'A' });
    await repos.tasks.create({ title: 'B', status: 'in_progress' });
    await repos.tasks.create({ title: 'C', status: 'done' });
    renderApp(repos, '/bao-cao');
    const card = (name: string) => screen.getByRole('group', { name });
    await waitFor(() => expect(card('Tổng')).toHaveTextContent('3'));
    expect(card('Đang làm')).toHaveTextContent('1');
    expect(card('Đã xong')).toHaveTextContent('1');
    expect(card('Tỉ lệ hoàn thành')).toHaveTextContent('33%');
  });

  it('liệt kê việc trễ hạn và sắp đến hạn; bấm để mở hộp thoại sửa', async () => {
    const user = userEvent.setup();
    const repos = createTestRepositories();
    await repos.tasks.create({ title: 'Nộp thuế', dueAt: hoursFromNow(-30) });
    await repos.tasks.create({ title: 'Họp nhóm', dueAt: hoursFromNow(5) });
    await repos.tasks.create({ title: 'Đi du lịch', dueAt: hoursFromNow(24 * 10) });
    renderApp(repos, '/bao-cao');

    const overdue = await screen.findByRole('region', { name: 'Trễ hạn (1)' });
    const soon = screen.getByRole('region', { name: 'Sắp đến hạn (1)' });
    expect(within(soon).getByRole('button', { name: /Họp nhóm/ })).toBeInTheDocument();
    expect(screen.queryByText('Đi du lịch')).not.toBeInTheDocument();

    await user.click(within(overdue).getByRole('button', { name: /Nộp thuế/ }));
    expect(await screen.findByRole('dialog', { name: 'Sửa công việc' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Báo cáo' })).toBeInTheDocument();
  });

  it('chuyển khoảng thời gian của biểu đồ cột', async () => {
    const user = userEvent.setup();
    renderApp(createTestRepositories(), '/bao-cao');
    const week = await screen.findByRole('button', { name: '8 tuần' });
    expect(screen.getByRole('button', { name: '7 ngày' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(week);
    expect(week).toHaveAttribute('aria-pressed', 'true');
  });
});
```

Run: `npx vitest run src/features/report`
Expected: FAIL — không tìm thấy nhóm "Tổng".

- [ ] **Step 2: Viết `src/features/report/ReportPage.tsx`**

```tsx
import { useId, useMemo, useState, type ReactNode } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { card } from '../../components/ui/styles';
import { completionsByDay, completionsByWeek, dueSoonTasks, overdueTasks, summarize } from '../../domain/stats';
import { STATUS_LABELS, TASK_STATUSES, type Task, type TaskStatus } from '../../domain/task';
import { useTasks } from '../../hooks/useTasks';
import { formatDueLabel } from '../../lib/format';
import { useNow } from '../../lib/useNow';
import { useTaskDialogParam } from '../tasks/useTaskDialogParam';

const STATUS_COLORS: Record<TaskStatus, string> = {
  todo: '#94a3b8',
  in_progress: '#3b82f6',
  done: '#22c55e',
  on_hold: '#f59e0b',
};

function StatCard({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div role="group" aria-label={label} className={card}>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

function Panel({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className={card}>
      <header className="mb-3 flex items-center justify-between gap-2">
        <h2 id={id} className="font-semibold">
          {title}
        </h2>
        {action}
      </header>
      {children}
    </section>
  );
}

function TaskLinkList({
  tasks,
  now,
  empty,
  onOpen,
}: {
  tasks: Task[];
  now: Date;
  empty: string;
  onOpen: (id: string) => void;
}) {
  if (tasks.length === 0) return <p className="text-sm text-slate-500">{empty}</p>;
  return (
    <ul className="space-y-1">
      {tasks.map((task) => (
        <li key={task.id}>
          <button
            type="button"
            onClick={() => onOpen(task.id)}
            className="flex w-full justify-between gap-3 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <span className="truncate">{task.title}</span>
            <span className="shrink-0 text-slate-500">{formatDueLabel(task.dueAt!, now)}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

export function ReportPage() {
  const { data: tasks = [] } = useTasks();
  const now = useNow();
  const { openTask } = useTaskDialogParam();
  const [range, setRange] = useState<'day' | 'week'>('day');

  const summary = useMemo(() => summarize(tasks), [tasks]);
  const buckets = useMemo(
    () => (range === 'day' ? completionsByDay(tasks, now) : completionsByWeek(tasks, now)),
    [tasks, now, range],
  );
  const overdue = useMemo(() => overdueTasks(tasks, now), [tasks, now]);
  const soon = useMemo(() => dueSoonTasks(tasks, now), [tasks, now]);
  const pieData = TASK_STATUSES.map((s) => ({ status: s, name: STATUS_LABELS[s], value: summary.byStatus[s] })).filter(
    (d) => d.value > 0,
  );

  const rangeToggle = (
    <div className="inline-flex overflow-hidden rounded-lg border border-slate-300 text-sm dark:border-slate-700">
      {(
        [
          ['day', '7 ngày'],
          ['week', '8 tuần'],
        ] as const
      ).map(([value, label]) => (
        <button
          key={value}
          type="button"
          aria-pressed={range === value}
          onClick={() => setRange(value)}
          className={`px-3 py-1 ${range === value ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
        >
          {label}
        </button>
      ))}
    </div>
  );

  return (
    <section className="mx-auto max-w-5xl space-y-6">
      <h1 className="text-2xl font-bold">Báo cáo</h1>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Tổng" value={summary.total} />
        <StatCard label="Đang làm" value={summary.byStatus.in_progress} />
        <StatCard label="Đã xong" value={summary.byStatus.done} />
        <StatCard label="Tỉ lệ hoàn thành" value={`${summary.completionRate}%`} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="Phân bổ trạng thái">
          {pieData.length === 0 ? (
            <p className="text-sm text-slate-500">Chưa có dữ liệu</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90}>
                  {pieData.map((d) => (
                    <Cell key={d.status} fill={STATUS_COLORS[d.status]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Panel>
        <Panel title="Việc hoàn thành theo thời gian" action={rangeToggle}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={buckets}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" name="Việc hoàn thành" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Panel title={`Trễ hạn (${overdue.length})`}>
          <TaskLinkList tasks={overdue} now={now} empty="Không có việc trễ hạn" onOpen={openTask} />
        </Panel>
        <Panel title={`Sắp đến hạn (${soon.length})`}>
          <TaskLinkList tasks={soon} now={now} empty="Không có việc sắp đến hạn" onOpen={openTask} />
        </Panel>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Chạy toàn bộ test**

Run: `npm test`
Expected: PASS toàn bộ. (Recharts có thể in cảnh báo kích thước 0 trong jsdom — chấp nhận được.)

- [ ] **Step 4: Xem bằng mắt**

Run: `npm run dev`, mở `/bao-cao` với vài việc đã xong / trễ hạn. Kiểm tra hai biểu đồ hiển thị ở cả chế độ sáng và tối. Dừng server.

- [ ] **Step 5: Commit**

```bash
git add src/features/report
git commit -m "feat(report): trang báo cáo với thẻ số liệu, biểu đồ và danh sách hạn chót" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 15: Trang Cài đặt — nhãn, giao diện, sao lưu, trạng thái lưu trữ

**Files:**
- Create: `src/features/settings/LabelManager.tsx`, `src/features/settings/ThemeSection.tsx`, `src/features/settings/BackupSection.tsx`, `src/features/settings/StorageStatus.tsx`
- Modify: `src/features/settings/SettingsPage.tsx` (viết lại toàn bộ)
- Test: `src/features/settings/SettingsPage.test.tsx`

**Interfaces:**
- Consumes: `useLabels`, `useCreateLabel`, `useUpdateLabel`, `useDeleteLabel`, `useImportData`, `useTasks`, `useToast`, `usePref`, `PREF_KEYS`, `errorMessage`, `SAVE_ERROR` (Task 9); `createBackup`, `parseBackup`, `previewImport`, `backupFileName` (Task 8); `LABEL_COLOR_NAMES`, `LABEL_COLOR_CLASSES` (Task 12); `ThemePref` (Task 10); `formatDateTime` (Task 12)
- Produces: trang `/cai-dat` có các mục (h2) "Nhãn", "Giao diện", "Sao lưu", "Lưu trữ"; Task 16 sẽ chèn thêm mục "Nhắc hạn chót"

- [ ] **Step 1: Viết test thất bại**

`src/features/settings/SettingsPage.test.tsx`:
```tsx
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { createBackup } from '../../data/backup';
import { createTestRepositories, renderApp } from '../../test/render';

describe('trang Cài đặt', () => {
  it('thêm nhãn; trùng tên thì báo lỗi', async () => {
    const user = userEvent.setup();
    const repos = createTestRepositories();
    renderApp(repos, '/cai-dat');
    await user.type(await screen.findByLabelText('Tên nhãn mới'), 'Công việc');
    await user.selectOptions(screen.getByLabelText('Màu nhãn mới'), 'green');
    await user.click(screen.getByRole('button', { name: 'Thêm nhãn' }));
    expect(await screen.findByLabelText('Tên nhãn Công việc')).toHaveValue('Công việc');
    expect((await repos.labels.list())[0]).toMatchObject({ name: 'Công việc', color: 'green' });

    await user.type(screen.getByLabelText('Tên nhãn mới'), 'công VIỆC');
    await user.click(screen.getByRole('button', { name: 'Thêm nhãn' }));
    expect(await screen.findByText('Nhãn này đã tồn tại')).toBeInTheDocument();
  });

  it('xoá nhãn sau khi xác nhận và gỡ khỏi các việc', async () => {
    const user = userEvent.setup();
    const repos = createTestRepositories();
    const label = await repos.labels.create({ name: 'Cá nhân', color: 'pink' });
    await repos.tasks.create({ title: 'T', labelIds: [label.id] });
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderApp(repos, '/cai-dat');
    expect(await screen.findByText('1 việc')).toBeInTheDocument(); // chờ danh sách việc tải xong
    await user.click(screen.getByRole('button', { name: 'Xoá nhãn Cá nhân' }));
    expect(confirm).toHaveBeenCalledWith('Xoá nhãn "Cá nhân"? Nhãn sẽ bị gỡ khỏi 1 công việc.');
    await waitFor(async () => expect(await repos.labels.list()).toEqual([]));
    expect((await repos.tasks.list())[0].labelIds).toEqual([]);
  });

  it('chọn giao diện Tối', async () => {
    const user = userEvent.setup();
    renderApp(createTestRepositories(), '/cai-dat');
    await user.click(await screen.findByRole('radio', { name: 'Tối' }));
    await waitFor(() => expect(document.documentElement).toHaveClass('dark'));
    expect(localStorage.getItem('cvct.theme')).toBe('"dark"');
  });

  it('xuất dữ liệu ghi lại thời điểm sao lưu', async () => {
    const user = userEvent.setup();
    URL.createObjectURL = vi.fn(() => 'blob:test');
    URL.revokeObjectURL = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    renderApp(createTestRepositories(), '/cai-dat');
    expect(await screen.findByText('Chưa sao lưu lần nào.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Xuất dữ liệu' }));
    expect(click).toHaveBeenCalled();
    expect(await screen.findByText(/^Lần sao lưu gần nhất:/)).toBeInTheDocument();
  });

  it('nhập file sai thì báo lỗi, file đúng thì gộp dữ liệu', async () => {
    const user = userEvent.setup();
    const repos = createTestRepositories();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderApp(repos, '/cai-dat');
    const input = await screen.findByLabelText('Nhập dữ liệu');

    await user.upload(input, new File(['{oops'], 'sai.json', { type: 'application/json' }));
    expect(await screen.findByText('File không phải JSON hợp lệ')).toBeInTheDocument();

    const source = createTestRepositories();
    await source.tasks.create({ title: 'Từ file sao lưu' });
    const json = JSON.stringify(createBackup(await source.tasks.list(), [], new Date()));
    await user.upload(input, new File([json], 'dung.json', { type: 'application/json' }));
    expect(await screen.findByText('Đã nhập dữ liệu')).toBeInTheDocument();
    expect((await repos.tasks.list()).map((t) => t.title)).toEqual(['Từ file sao lưu']);
  });
});
```

Run: `npx vitest run src/features/settings`
Expected: FAIL — không tìm thấy nhãn "Tên nhãn mới".

- [ ] **Step 2: Viết các mục cài đặt**

`src/features/settings/LabelManager.tsx`:
```tsx
import { useMemo, useState, type FormEvent } from 'react';
import { useToast } from '../../components/ui/Toast';
import { btn, field } from '../../components/ui/styles';
import { LABEL_COLORS, type Label, type LabelColor } from '../../domain/task';
import { useCreateLabel, useDeleteLabel, useLabels, useUpdateLabel } from '../../hooks/useLabels';
import { useTasks } from '../../hooks/useTasks';
import { errorMessage } from '../../lib/errors';
import { LABEL_COLOR_CLASSES, LABEL_COLOR_NAMES } from '../../lib/labelColors';

function ColorSelect({ label, value, onChange }: { label: string; value: LabelColor; onChange: (c: LabelColor) => void }) {
  return (
    <select aria-label={label} className={`${field} w-auto`} value={value} onChange={(e) => onChange(e.target.value as LabelColor)}>
      {LABEL_COLORS.map((c) => (
        <option key={c} value={c}>
          {LABEL_COLOR_NAMES[c]}
        </option>
      ))}
    </select>
  );
}

export function LabelManager() {
  const { data: labels = [] } = useLabels();
  const { data: tasks = [] } = useTasks();
  const createLabel = useCreateLabel();
  const updateLabel = useUpdateLabel();
  const deleteLabel = useDeleteLabel();
  const toast = useToast();
  const [name, setName] = useState('');
  const [color, setColor] = useState<LabelColor>('blue');
  const [error, setError] = useState('');

  const usage = useMemo(() => {
    const counts = new Map<string, number>();
    for (const t of tasks) for (const id of t.labelIds) counts.set(id, (counts.get(id) ?? 0) + 1);
    return counts;
  }, [tasks]);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    try {
      await createLabel.mutateAsync({ name, color });
      setName('');
      setError('');
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  function rename(label: Label, input: HTMLInputElement) {
    if (input.value.trim() === label.name) return;
    updateLabel.mutate(
      { id: label.id, patch: { name: input.value } },
      {
        onError: (err) => {
          input.value = label.name;
          toast.show({ message: errorMessage(err) });
        },
      },
    );
  }

  function recolor(label: Label, next: LabelColor) {
    updateLabel.mutate({ id: label.id, patch: { color: next } }, { onError: (err) => toast.show({ message: errorMessage(err) }) });
  }

  function remove(label: Label) {
    const count = usage.get(label.id) ?? 0;
    if (!window.confirm(`Xoá nhãn "${label.name}"? Nhãn sẽ bị gỡ khỏi ${count} công việc.`)) return;
    deleteLabel.mutate(label.id, { onError: (err) => toast.show({ message: errorMessage(err) }) });
  }

  return (
    <div className="space-y-4">
      {labels.length === 0 ? (
        <p className="text-sm text-slate-500">Chưa có nhãn nào.</p>
      ) : (
        <ul className="space-y-2">
          {labels.map((label) => (
            <li key={label.id} className="flex flex-wrap items-center gap-2">
              <span className={`size-3 shrink-0 rounded-full ${LABEL_COLOR_CLASSES[label.color]}`} aria-hidden="true" />
              <input
                key={`${label.id}:${label.name}`}
                aria-label={`Tên nhãn ${label.name}`}
                className={`${field} w-44`}
                defaultValue={label.name}
                onBlur={(e) => rename(label, e.currentTarget)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.currentTarget.blur();
                }}
              />
              <ColorSelect label={`Màu nhãn ${label.name}`} value={label.color} onChange={(c) => recolor(label, c)} />
              <span className="text-xs text-slate-500">{usage.get(label.id) ?? 0} việc</span>
              <button type="button" className={btn.danger} aria-label={`Xoá nhãn ${label.name}`} onClick={() => remove(label)}>
                Xoá
              </button>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={handleAdd} className="flex flex-wrap items-center gap-2">
        <input
          aria-label="Tên nhãn mới"
          placeholder="Tên nhãn mới"
          className={`${field} w-44`}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <ColorSelect label="Màu nhãn mới" value={color} onChange={setColor} />
        <button type="submit" className={btn.secondary}>
          Thêm nhãn
        </button>
      </form>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
```

`src/features/settings/ThemeSection.tsx`:
```tsx
import { PREF_KEYS, usePref } from '../../lib/prefs';
import type { ThemePref } from '../../lib/theme';

const OPTIONS: { value: ThemePref; label: string }[] = [
  { value: 'light', label: 'Sáng' },
  { value: 'dark', label: 'Tối' },
  { value: 'system', label: 'Theo hệ thống' },
];

export function ThemeSection() {
  const [theme, setTheme] = usePref<ThemePref>(PREF_KEYS.theme, 'system');
  return (
    <fieldset className="flex flex-wrap gap-4">
      <legend className="sr-only">Chọn giao diện</legend>
      {OPTIONS.map((o) => (
        <label key={o.value} className="flex items-center gap-2 text-sm">
          <input type="radio" name="theme" value={o.value} checked={theme === o.value} onChange={() => setTheme(o.value)} />
          {o.label}
        </label>
      ))}
    </fieldset>
  );
}
```

`src/features/settings/BackupSection.tsx`:
```tsx
import { useState, type ChangeEvent } from 'react';
import { useToast } from '../../components/ui/Toast';
import { btn } from '../../components/ui/styles';
import { backupFileName, createBackup, parseBackup, previewImport } from '../../data/backup';
import { useImportData } from '../../hooks/useImportData';
import { useLabels } from '../../hooks/useLabels';
import { useTasks } from '../../hooks/useTasks';
import { SAVE_ERROR } from '../../lib/errors';
import { formatDateTime } from '../../lib/format';
import { PREF_KEYS, usePref } from '../../lib/prefs';

const BACKUP_REMINDER_MS = 7 * 24 * 60 * 60 * 1000;

/** Dùng FileReader thay cho File#text() để chạy được cả trên trình duyệt cũ và jsdom. */
function readFileText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

export function BackupSection() {
  const { data: tasks = [] } = useTasks();
  const { data: labels = [] } = useLabels();
  const importData = useImportData();
  const toast = useToast();
  const [lastBackupAt, setLastBackupAt] = usePref<string | null>(PREF_KEYS.lastBackupAt, null);
  const [error, setError] = useState('');

  function handleExport() {
    const now = new Date();
    const backup = createBackup(tasks, labels, now);
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = backupFileName(now);
    link.click();
    URL.revokeObjectURL(url);
    setLastBackupAt(backup.exportedAt);
  }

  async function handleImport(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const parsed = parseBackup(await readFileText(file));
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }
    setError('');
    const p = previewImport(parsed.data, tasks, labels);
    const ok = window.confirm(
      `Nhập ${p.newTasks} việc mới, ghi đè ${p.overwrittenTasks} việc; ${p.newLabels} nhãn mới, ghi đè ${p.overwrittenLabels} nhãn. Tiếp tục?`,
    );
    if (!ok) return;
    try {
      await importData.mutateAsync({ tasks: parsed.data.tasks, labels: parsed.data.labels });
      toast.show({ message: 'Đã nhập dữ liệu' });
    } catch {
      toast.show({ message: SAVE_ERROR });
    }
  }

  const stale = !lastBackupAt || Date.now() - Date.parse(lastBackupAt) > BACKUP_REMINDER_MS;

  return (
    <div className="space-y-3 text-sm">
      <p>{lastBackupAt ? `Lần sao lưu gần nhất: ${formatDateTime(lastBackupAt)}` : 'Chưa sao lưu lần nào.'}</p>
      {stale && (
        <p className="text-amber-700 dark:text-amber-400">
          Nên xuất file sao lưu ít nhất mỗi tuần — dữ liệu chỉ nằm trong trình duyệt này.
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button type="button" className={btn.secondary} onClick={handleExport}>
          Xuất dữ liệu
        </button>
        <label className={`${btn.secondary} cursor-pointer`}>
          Nhập dữ liệu
          <input type="file" accept="application/json,.json" className="sr-only" onChange={handleImport} />
        </label>
      </div>
      {error && (
        <p role="alert" className="text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
```

`src/features/settings/StorageStatus.tsx`:
```tsx
import { useEffect, useState } from 'react';

export function StorageStatus() {
  const [persisted, setPersisted] = useState<boolean | null>(null);

  useEffect(() => {
    let alive = true;
    navigator.storage
      ?.persisted?.()
      .then((value) => {
        if (alive) setPersisted(value);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  const text =
    persisted === null ? 'Không rõ' : persisted ? 'Có' : 'Chưa — trình duyệt có thể xoá dữ liệu khi máy thiếu dung lượng';
  return <p className="text-sm">Dữ liệu được bảo vệ khỏi việc tự xoá: {text}</p>;
}
```

`src/features/settings/SettingsPage.tsx`:
```tsx
import { useId, type ReactNode } from 'react';
import { card } from '../../components/ui/styles';
import { BackupSection } from './BackupSection';
import { LabelManager } from './LabelManager';
import { StorageStatus } from './StorageStatus';
import { ThemeSection } from './ThemeSection';

function Section({ title, children }: { title: string; children: ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className={card}>
      <h2 id={id} className="mb-3 font-semibold">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">Cài đặt</h1>
      <Section title="Nhãn">
        <LabelManager />
      </Section>
      <Section title="Giao diện">
        <ThemeSection />
      </Section>
      <Section title="Sao lưu">
        <BackupSection />
      </Section>
      <Section title="Lưu trữ">
        <StorageStatus />
      </Section>
    </div>
  );
}
```

- [ ] **Step 3: Chạy toàn bộ test**

Run: `npm test`
Expected: PASS toàn bộ.

- [ ] **Step 4: Commit**

```bash
git add src/features/settings
git commit -m "feat(settings): quản lý nhãn, giao diện, xuất / nhập sao lưu, trạng thái lưu trữ" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 16: Nhắc hạn chót bằng Notifications API

**Files:**
- Create: `src/notifications/notifier.ts`, `src/notifications/tick.ts`, `src/notifications/useReminderSettings.ts`, `src/notifications/ReminderRunner.tsx`, `src/notifications/ReminderBanner.tsx`, `src/features/settings/ReminderSection.tsx`
- Modify: `src/app/Layout.tsx`, `src/features/tasks/TasksPage.tsx`, `src/features/settings/SettingsPage.tsx`
- Test: `src/notifications/tick.test.ts`, `src/notifications/reminders.ui.test.tsx`

**Interfaces:**
- Consumes: `dueReminders`, `dailySummary`, `pruneSentKeys` (Task 6); `isOverdue` (Task 2); `readPref`, `writePref`, `usePref`, `PREF_KEYS` (Task 9); `useTasks` (Task 9); `useTaskDialogParam` (Task 11)
- Produces:
  - `notifier.ts`: `PermissionState`, `getPermission()`, `requestPermission()`, `AppNotification { title; body; taskId? }`, `showNotification(n, onOpenTask)`
  - `tick.ts`: `ReminderStore`, `runReminderTick(tasks, now, store, notify, { prune })`, `localReminderStore`
  - `useReminderSettings()`: `{ enabled; permission; active; setEnabled(value): Promise<PermissionState> }`
  - `ReminderRunner` (trong Layout), `ReminderBanner({ tasks, now })` (đầu trang Công việc), `ReminderSection` (Cài đặt)

- [ ] **Step 1: Viết test thất bại cho vòng kiểm tra**

`src/notifications/tick.test.ts`:
```ts
import { describe, expect, it, vi } from 'vitest';
import { reminderKey } from '../domain/reminders';
import { makeTask } from '../test/factories';
import { runReminderTick, type ReminderStore } from './tick';

const now = new Date(2026, 9, 16, 10, 0);
const at = (d: number, h: number, m = 0) => new Date(2026, 9, d, h, m).toISOString();

function memoryStore(initial: Partial<{ sent: string[]; last: string | null }> = {}) {
  let sent = initial.sent ?? [];
  let last = initial.last ?? null;
  const store: ReminderStore = {
    getSent: () => sent,
    setSent: (keys) => {
      sent = keys;
    },
    getLastSummaryDate: () => last,
    setLastSummaryDate: (d) => {
      last = d;
    },
  };
  return { store, sent: () => sent, last: () => last };
}

describe('runReminderTick', () => {
  const soon = makeTask({ id: 'soon', title: 'Họp nhóm', dueAt: at(16, 10, 30) });
  const late = makeTask({ id: 'late', title: 'Nộp thuế', dueAt: at(16, 8) });

  it('lần đầu trong ngày: tóm tắt + nhắc từng việc; lần sau không lặp', () => {
    const notify = vi.fn();
    const mem = memoryStore();
    runReminderTick([soon, late], now, mem.store, notify, { prune: true });
    expect(notify.mock.calls.map(([n]) => n)).toEqual([
      { title: 'Công Việc Của Tôi', body: 'Hôm nay có 1 việc đến hạn, 1 việc đang trễ' },
      { title: 'Sắp đến hạn', body: 'Họp nhóm', taskId: 'soon' },
      { title: 'Đã trễ hạn', body: 'Nộp thuế', taskId: 'late' },
    ]);
    expect(mem.last()).toBe('2026-10-16');
    expect(mem.sent()).toEqual([reminderKey(soon, 'due_soon'), reminderKey(late, 'overdue')]);

    notify.mockClear();
    runReminderTick([soon, late], now, mem.store, notify, { prune: false });
    expect(notify).not.toHaveBeenCalled();
  });

  it('không có gì đến hạn thì không gửi tóm tắt nhưng vẫn ghi ngày', () => {
    const notify = vi.fn();
    const mem = memoryStore();
    runReminderTick([makeTask({ dueAt: at(25, 9) })], now, mem.store, notify, { prune: true });
    expect(notify).not.toHaveBeenCalled();
    expect(mem.last()).toBe('2026-10-16');
  });

  it('prune dọn khoá cũ', () => {
    const mem = memoryStore({ sent: ['xoa-roi:2026-10-01T00:00:00.000Z:overdue'], last: '2026-10-16' });
    runReminderTick([], now, mem.store, vi.fn(), { prune: true });
    expect(mem.sent()).toEqual([]);
  });
});
```

Run: `npx vitest run src/notifications/tick.test.ts`
Expected: FAIL — không tìm thấy module `./tick`.

- [ ] **Step 2: Viết notifier và tick**

`src/notifications/notifier.ts`:
```ts
export type PermissionState = NotificationPermission | 'unsupported';

export interface AppNotification {
  title: string;
  body: string;
  taskId?: string;
}

export function getPermission(): PermissionState {
  return typeof Notification === 'undefined' ? 'unsupported' : Notification.permission;
}

export async function requestPermission(): Promise<PermissionState> {
  if (typeof Notification === 'undefined') return 'unsupported';
  try {
    return await Notification.requestPermission();
  } catch {
    return 'denied';
  }
}

export function showNotification(notification: AppNotification, onOpenTask: (id: string) => void): void {
  if (getPermission() !== 'granted') return;
  try {
    const n = new Notification(notification.title, {
      body: notification.body,
      icon: '/pwa-192x192.png',
      tag: notification.taskId ?? 'daily-summary',
    });
    n.onclick = () => {
      window.focus();
      if (notification.taskId) onOpenTask(notification.taskId);
      n.close();
    };
  } catch {
    // Một số trình duyệt di động chỉ cho phép thông báo qua service worker; bỏ qua.
  }
}
```

`src/notifications/tick.ts`:
```ts
import { format } from 'date-fns';
import { dailySummary, dueReminders, pruneSentKeys } from '../domain/reminders';
import type { Task } from '../domain/task';
import { PREF_KEYS, readPref, writePref } from '../lib/prefs';
import type { AppNotification } from './notifier';

export interface ReminderStore {
  getSent(): string[];
  setSent(keys: string[]): void;
  getLastSummaryDate(): string | null;
  setLastSummaryDate(date: string): void;
}

export const localReminderStore: ReminderStore = {
  getSent: () => readPref<string[]>(PREF_KEYS.remindersSent, []),
  setSent: (keys) => writePref(PREF_KEYS.remindersSent, keys),
  getLastSummaryDate: () => readPref<string | null>(PREF_KEYS.lastSummaryDate, null),
  setLastSummaryDate: (date) => writePref(PREF_KEYS.lastSummaryDate, date),
};

export function runReminderTick(
  tasks: Task[],
  now: Date,
  store: ReminderStore,
  notify: (notification: AppNotification) => void,
  options: { prune: boolean },
): void {
  const today = format(now, 'yyyy-MM-dd');
  if (store.getLastSummaryDate() !== today) {
    store.setLastSummaryDate(today);
    const summary = dailySummary(tasks, now);
    if (summary) {
      notify({
        title: 'Công Việc Của Tôi',
        body: `Hôm nay có ${summary.dueToday} việc đến hạn, ${summary.overdue} việc đang trễ`,
      });
    }
  }

  let sent = store.getSent();
  if (options.prune) sent = pruneSentKeys(sent, tasks);
  const sentSet = new Set(sent);
  const reminders = dueReminders(tasks, now, sentSet);
  for (const reminder of reminders) {
    notify({
      title: reminder.kind === 'due_soon' ? 'Sắp đến hạn' : 'Đã trễ hạn',
      body: reminder.task.title,
      taskId: reminder.task.id,
    });
    sentSet.add(reminder.key);
  }
  if (options.prune || reminders.length > 0) store.setSent([...sentSet]);
}
```

Run: `npx vitest run src/notifications/tick.test.ts`
Expected: PASS.

- [ ] **Step 3: Viết test thất bại cho phần giao diện**

`src/notifications/reminders.ui.test.tsx`:
```tsx
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { createTestRepositories, renderApp } from '../test/render';

const created: { title: string; options?: NotificationOptions }[] = [];

function stubNotification(permission: NotificationPermission, answer: NotificationPermission = permission) {
  created.length = 0;
  class FakeNotification {
    static permission: NotificationPermission = permission;
    static requestPermission = vi.fn(async () => {
      FakeNotification.permission = answer;
      return answer;
    });
    onclick: (() => void) | null = null;
    constructor(title: string, options?: NotificationOptions) {
      created.push({ title, options });
    }
    close() {}
  }
  vi.stubGlobal('Notification', FakeNotification);
}

const minutesFromNow = (m: number) => new Date(Date.now() + m * 60_000).toISOString();

describe('nhắc hạn chót', () => {
  it('bật trong Cài đặt khi được cấp quyền', async () => {
    const user = userEvent.setup();
    stubNotification('default', 'granted');
    renderApp(createTestRepositories(), '/cai-dat');
    const toggle = await screen.findByRole('checkbox', { name: 'Nhắc hạn chót bằng thông báo' });
    await user.click(toggle);
    await waitFor(() => expect(toggle).toBeChecked());
    expect(localStorage.getItem('cvct.reminders')).toBe('true');
  });

  it('bị từ chối quyền thì tắt và giải thích', async () => {
    const user = userEvent.setup();
    stubNotification('default', 'denied');
    renderApp(createTestRepositories(), '/cai-dat');
    const toggle = await screen.findByRole('checkbox', { name: 'Nhắc hạn chót bằng thông báo' });
    await user.click(toggle);
    expect(await screen.findByText(/Bạn chưa cho phép thông báo/)).toBeInTheDocument();
    expect(toggle).not.toBeChecked();
  });

  it('đang bật và có quyền thì gửi thông báo khi việc sắp đến hạn', async () => {
    stubNotification('granted');
    localStorage.setItem('cvct.reminders', 'true');
    const repos = createTestRepositories();
    await repos.tasks.create({ title: 'Họp nhóm', dueAt: minutesFromNow(30) });
    renderApp(repos);
    await waitFor(() => expect(created.map((n) => n.title)).toContain('Sắp đến hạn'));
    expect(created.find((n) => n.title === 'Sắp đến hạn')?.options?.body).toBe('Họp nhóm');
  });

  it('không có thông báo thì hiện dải cảnh báo khi có việc trễ', async () => {
    const repos = createTestRepositories();
    await repos.tasks.create({ title: 'Nộp thuế', dueAt: minutesFromNow(-60) });
    renderApp(repos);
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Bạn có 1 việc trễ hạn.');
    expect(alert).toHaveTextContent('Trình duyệt này không hỗ trợ thông báo.');
  });
});
```

Run: `npx vitest run src/notifications/reminders.ui.test.tsx`
Expected: FAIL — không tìm thấy checkbox "Nhắc hạn chót bằng thông báo".

- [ ] **Step 4: Viết hook, runner, banner, mục cài đặt**

`src/notifications/useReminderSettings.ts`:
```ts
import { useCallback } from 'react';
import { PREF_KEYS, usePref } from '../lib/prefs';
import { getPermission, requestPermission, type PermissionState } from './notifier';

export function useReminderSettings() {
  const [enabled, setEnabledPref] = usePref<boolean>(PREF_KEYS.reminders, false);
  // Đọc trực tiếp mỗi lần render: quyền có thể đổi ở nơi khác (Cài đặt, trình duyệt).
  const permission = getPermission();

  const setEnabled = useCallback(
    async (value: boolean): Promise<PermissionState> => {
      if (!value) {
        setEnabledPref(false);
        return getPermission();
      }
      const result = await requestPermission();
      setEnabledPref(result === 'granted');
      return result;
    },
    [setEnabledPref],
  );

  return { enabled, permission, active: enabled && permission === 'granted', setEnabled };
}
```

`src/notifications/ReminderRunner.tsx`:
```tsx
import { useEffect, useRef } from 'react';
import { useTaskDialogParam } from '../features/tasks/useTaskDialogParam';
import { useTasks } from '../hooks/useTasks';
import { showNotification } from './notifier';
import { localReminderStore, runReminderTick } from './tick';
import { useReminderSettings } from './useReminderSettings';

const CHECK_INTERVAL_MS = 60_000;

export function ReminderRunner() {
  const { active } = useReminderSettings();
  const { data: tasks } = useTasks();
  const { openTask } = useTaskDialogParam();
  const openRef = useRef(openTask);
  const prunedRef = useRef(false);

  useEffect(() => {
    openRef.current = openTask;
  });

  useEffect(() => {
    if (!active || !tasks) return;
    const run = () => {
      runReminderTick(
        tasks,
        new Date(),
        localReminderStore,
        (n) => showNotification(n, (id) => openRef.current(id)),
        { prune: !prunedRef.current },
      );
      prunedRef.current = true;
    };
    run();
    const id = window.setInterval(run, CHECK_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [active, tasks]);

  return null;
}
```

`src/notifications/ReminderBanner.tsx`:
```tsx
import { Link } from 'react-router';
import { isOverdue } from '../domain/rules';
import type { Task } from '../domain/task';
import { useReminderSettings } from './useReminderSettings';

export function ReminderBanner({ tasks, now }: { tasks: Task[]; now: Date }) {
  const { active, permission } = useReminderSettings();
  const overdue = tasks.filter((t) => isOverdue(t, now)).length;
  if (active || overdue === 0) return null;

  const hint =
    permission === 'denied' ? (
      'Trình duyệt đang chặn thông báo của trang này.'
    ) : permission === 'unsupported' ? (
      'Trình duyệt này không hỗ trợ thông báo.'
    ) : (
      <>
        Bật{' '}
        <Link to="/cai-dat" className="font-semibold underline">
          Nhắc hạn chót
        </Link>{' '}
        để nhận thông báo.
      </>
    );

  return (
    <div
      role="alert"
      className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
    >
      Bạn có {overdue} việc trễ hạn. {hint}
    </div>
  );
}
```

`src/features/settings/ReminderSection.tsx`:
```tsx
import { useState, type ChangeEvent } from 'react';
import { useReminderSettings } from '../../notifications/useReminderSettings';

export function ReminderSection() {
  const { enabled, setEnabled } = useReminderSettings();
  const [message, setMessage] = useState('');

  async function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const checked = e.target.checked;
    const result = await setEnabled(checked);
    if (!checked || result === 'granted') {
      setMessage('');
    } else if (result === 'unsupported') {
      setMessage('Trình duyệt này không hỗ trợ thông báo.');
    } else {
      setMessage('Bạn chưa cho phép thông báo. Hãy cấp quyền trong cài đặt trang của trình duyệt rồi thử lại.');
    }
  }

  return (
    <div className="space-y-2 text-sm">
      <label className="flex items-center gap-2">
        <input type="checkbox" className="size-4" checked={enabled} onChange={handleChange} />
        Nhắc hạn chót bằng thông báo
      </label>
      <p className="text-slate-500">
        Nhắc khi còn 1 giờ, khi vừa trễ hạn, và tóm tắt mỗi ngày. Chỉ hoạt động khi ứng dụng đang mở (tab hoặc app đã cài).
      </p>
      {message && (
        <p role="alert" className="text-red-600">
          {message}
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Gắn vào ứng dụng**

`src/app/Layout.tsx`: thêm `import { ReminderRunner } from '../notifications/ReminderRunner';` và đặt `<ReminderRunner />` ngay sau `<TaskDialogHost />`.

`src/features/tasks/TasksPage.tsx`: thêm `import { ReminderBanner } from '../../notifications/ReminderBanner';` và đặt `<ReminderBanner tasks={tasks} now={now} />` ngay sau thẻ đóng `</header>`.

`src/features/settings/SettingsPage.tsx`: thêm `import { ReminderSection } from './ReminderSection';` và chèn mục sau mục "Nhãn":
```tsx
      <Section title="Nhắc hạn chót">
        <ReminderSection />
      </Section>
```

- [ ] **Step 6: Chạy toàn bộ test**

Run: `npm test`
Expected: PASS toàn bộ.

- [ ] **Step 7: Thử trong trình duyệt thật**

Run: `npm run dev`. Vào Cài đặt, bật "Nhắc hạn chót", cho phép thông báo. Tạo một việc có hạn hôm nay, giờ = 30 phút nữa → thông báo "Sắp đến hạn" hiện trong vòng 1 phút. Bấm thông báo → app được đưa lên và hộp thoại sửa việc đó mở ra. Dừng server.

- [ ] **Step 8: Commit**

```bash
git add src
git commit -m "feat(notifications): nhắc hạn chót, tóm tắt trong ngày, dải cảnh báo khi không có quyền" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 17: PWA — cài như ứng dụng, chạy offline, thông báo bản cập nhật

**Files:**
- Create: `pwa-assets.config.ts`, `src/pwa/UpdatePrompt.tsx`
- Generate: `public/pwa-64x64.png`, `public/pwa-192x192.png`, `public/pwa-512x512.png`, `public/maskable-icon-512x512.png`, `public/apple-touch-icon-180x180.png`, `public/favicon.ico`
- Modify: `vite.config.ts`, `index.html`, `src/app/Layout.tsx`
- Test: `src/pwa/UpdatePrompt.test.tsx`

**Interfaces:**
- Consumes: `useRegisterSW` từ `virtual:pwa-register/react` (khi test: `src/test/pwaRegisterMock.ts`, Task 1)
- Produces: `UpdatePrompt` (trong Layout); build sinh `dist/sw.js` và `dist/manifest.webmanifest`

- [ ] **Step 1: Viết test thất bại**

`src/pwa/UpdatePrompt.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { UpdatePrompt } from './UpdatePrompt';

const { updateServiceWorker, setNeedRefresh } = vi.hoisted(() => ({
  updateServiceWorker: vi.fn(async (_reload?: boolean) => {}),
  setNeedRefresh: vi.fn(),
}));

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({
    needRefresh: [true, setNeedRefresh],
    offlineReady: [false, vi.fn()],
    updateServiceWorker,
  }),
}));

it('có bản mới thì hỏi tải lại, không tự tải', async () => {
  const user = userEvent.setup();
  render(<UpdatePrompt />);
  expect(screen.getByText('Có phiên bản mới.')).toBeInTheDocument();
  expect(updateServiceWorker).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: 'Tải lại' }));
  expect(updateServiceWorker).toHaveBeenCalledWith(true);
  await user.click(screen.getByRole('button', { name: 'Để sau' }));
  expect(setNeedRefresh).toHaveBeenCalledWith(false);
});
```

Run: `npx vitest run src/pwa`
Expected: FAIL — không tìm thấy module `./UpdatePrompt`.

- [ ] **Step 2: Viết `src/pwa/UpdatePrompt.tsx`**

```tsx
import { useRegisterSW } from 'virtual:pwa-register/react';

export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-4 bottom-20 z-50 mx-auto flex max-w-md items-center gap-3 rounded-xl bg-slate-900 p-3 text-sm text-white shadow-lg md:bottom-6"
    >
      <span className="flex-1">Có phiên bản mới.</span>
      <button type="button" className="font-semibold text-blue-300 hover:underline" onClick={() => void updateServiceWorker(true)}>
        Tải lại
      </button>
      <button type="button" className="text-slate-300 hover:underline" onClick={() => setNeedRefresh(false)}>
        Để sau
      </button>
    </div>
  );
}
```

`src/app/Layout.tsx`: thêm `import { UpdatePrompt } from '../pwa/UpdatePrompt';` và đặt `<UpdatePrompt />` ngay sau `<ReminderRunner />`.

Run: `npm test`
Expected: PASS toàn bộ.

- [ ] **Step 3: Sinh icon**

`pwa-assets.config.ts`:
```ts
import { defineConfig, minimal2023Preset as preset } from '@vite-pwa/assets-generator/config';

export default defineConfig({
  preset,
  images: ['public/favicon.svg'],
});
```

Run: `npm run icons`
Expected: tạo trong `public/` các file `pwa-64x64.png`, `pwa-192x192.png`, `pwa-512x512.png`, `maskable-icon-512x512.png`, `apple-touch-icon-180x180.png`, `favicon.ico`. Nếu tên file khác, sửa cho khớp ở Step 4 và trong `notifier.ts` (`icon: '/pwa-192x192.png'`).

- [ ] **Step 4: Cấu hình vite-plugin-pwa**

`vite.config.ts`: thêm `import { VitePWA } from 'vite-plugin-pwa';` và đổi `plugins` thành:
```ts
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.ico', 'favicon.svg', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'Công Việc Của Tôi',
        short_name: 'Công Việc',
        description: 'Quản lý công việc cá nhân gọn nhẹ',
        lang: 'vi',
        start_url: '/',
        display: 'standalone',
        background_color: '#f8fafc',
        theme_color: '#2563eb',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
        navigateFallback: '/index.html',
      },
    }),
  ],
```

`index.html`: thêm vào `<head>`, ngay sau dòng `<link rel="icon" …favicon.svg…>`:
```html
    <link rel="icon" href="/favicon.ico" sizes="any" />
    <link rel="apple-touch-icon" href="/apple-touch-icon-180x180.png" />
```

- [ ] **Step 5: Build và kiểm tra**

Run: `npm run build`
Expected: không lỗi; có `dist/sw.js` và `dist/manifest.webmanifest`. Nếu Workbox báo file vượt `maximumFileSizeToCacheInBytes` (2 MiB), thêm `maximumFileSizeToCacheInBytes: 3 * 1024 * 1024` vào `workbox`.

Run: `npm test`
Expected: PASS toàn bộ (alias trong `test` vẫn thay module ảo).

Run: `npm run preview`, mở `http://localhost:4173` trong Chrome:
1. DevTools → Application → Manifest: tên "Công Việc Của Tôi", icon hiển thị, có thể cài.
2. Application → Service Workers: đã kích hoạt.
3. Network → Offline, tải lại trang: app vẫn mở, dữ liệu vẫn còn, thêm việc được.

Dừng server.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(pwa): manifest, icon, service worker offline và thông báo bản cập nhật" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 18: Kiểm thử đầu-cuối bằng Playwright

**Files:**
- Create: `playwright.config.ts`, `e2e/smoke.spec.ts`

**Interfaces:**
- Consumes: toàn bộ ứng dụng đã build (`npm run build && npm run preview`)
- Produces: lệnh `npm run e2e` với 2 kịch bản khói

- [ ] **Step 1: Cài trình duyệt**

Run: `npx playwright install chromium`
Expected: tải xong Chromium.

- [ ] **Step 2: Tạo cấu hình**

`playwright.config.ts`:
```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  use: { baseURL: 'http://localhost:4173', locale: 'vi-VN' },
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
```

- [ ] **Step 3: Viết kịch bản**

`e2e/smoke.spec.ts`:
```ts
import { expect, test } from '@playwright/test';

test('thêm việc, hoàn thành, báo cáo hiện đúng tỉ lệ', async ({ page }) => {
  await page.goto('/');
  const quickAdd = page.getByLabel('Thêm nhanh công việc');
  await quickAdd.fill('Viết báo cáo quý');
  await quickAdd.press('Enter');
  await page.getByLabel('Đánh dấu "Viết báo cáo quý" đã xong').check();
  await page.getByRole('navigation', { name: 'Điều hướng chính' }).getByRole('link', { name: 'Báo cáo' }).click();
  await expect(page.getByRole('group', { name: 'Tỉ lệ hoàn thành' })).toContainText('100%');
});

test('tải lại trang vẫn giữ dữ liệu và bộ lọc trên URL', async ({ page }) => {
  await page.goto('/');
  const quickAdd = page.getByLabel('Thêm nhanh công việc');
  await quickAdd.fill('Mua sữa');
  await quickAdd.press('Enter');
  await quickAdd.fill('Gọi điện cho mẹ');
  await quickAdd.press('Enter');
  await expect(page.getByRole('button', { name: 'Gọi điện cho mẹ' })).toBeVisible();

  await page.getByLabel('Tìm công việc').fill('sua');
  await expect(page).toHaveURL(/q=sua/);
  await page.reload();

  await expect(page.getByLabel('Tìm công việc')).toHaveValue('sua');
  await expect(page.getByRole('button', { name: 'Mua sữa' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Gọi điện cho mẹ' })).toHaveCount(0);
});
```

- [ ] **Step 4: Chạy**

Run: `npm run e2e`
Expected: 2 passed.

- [ ] **Step 5: Kiểm tra cuối cùng**

Run: `npm run typecheck && npm test && npm run build`
Expected: tất cả đều qua.

- [ ] **Step 6: Commit**

```bash
git add playwright.config.ts e2e package.json package-lock.json
git commit -m "test(e2e): kịch bản khói Playwright cho luồng chính" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

## Đối chiếu spec

| Mục spec | Task |
|---|---|
| 2 Công nghệ | 1 |
| 3.1–3.3 Kiến trúc, repository | 7, 9, 10 |
| 4 Mô hình dữ liệu, Dexie version 1 | 2, 7 |
| 5.1 Trạng thái / completedAt | 2, 7 |
| 5.2 Trễ hạn / sắp đến hạn | 2, 12 |
| 5.3 Số liệu báo cáo | 5, 14 |
| 5.4 Xoá + hoàn tác, xoá nhãn | 7, 9, 12, 15 |
| 6.1 Điều hướng | 10 |
| 6.2 Trang Công việc (thêm nhanh, hộp thoại, lọc, tìm không dấu, sắp xếp, dòng, Kanban, URL, trạng thái trống, phím N) | 11, 12, 13 |
| 6.3 Trang Báo cáo | 14 |
| 6.4 Trang Cài đặt | 15, 16 |
| 7 Nhắc hạn chót | 6, 16 |
| 8.1 PWA | 17 |
| 8.2 Độ bền dữ liệu (`persist`, nhắc sao lưu) | 10, 15 |
| 8.3 Xuất / nhập JSON | 8, 15 |
| 8.4 Xử lý lỗi (form, lạc quan, IndexedDB, ErrorBoundary) | 9, 10, 11 |
| 9 Kiểm thử (TDD domain, test hợp đồng, sao lưu, RTL, Playwright) | 2–9, 11–18 |
