import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';
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
