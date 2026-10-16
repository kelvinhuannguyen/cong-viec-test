import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  use: { baseURL: 'http://localhost:4173', locale: 'vi-VN' },
  webServer: {
    // Build riêng vào dist-e2e để không đè lên bản build thật trong dist/.
    command: 'npm run build -- --outDir dist-e2e && npx vite preview --outDir dist-e2e --port 4173 --strictPort',
    url: 'http://localhost:4173',
    // Không dùng lại server có sẵn ở cổng 4173: có thể là bản build chế độ Supabase.
    reuseExistingServer: false,
    timeout: 180_000,
    // e2e chạy ở chế độ lưu trên máy (không đăng nhập): biến môi trường thật ghi đè .env.local khi build.
    env: { VITE_SUPABASE_URL: '', VITE_SUPABASE_PUBLISHABLE_KEY: '' },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
