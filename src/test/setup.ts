import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';
import { randomUUID } from 'node:crypto';
import { cleanup } from '@testing-library/react';
import { MotionGlobalConfig } from 'motion/react';
import { afterEach, vi } from 'vitest';

// Bỏ thời gian chuyển động trong test để phần tử thoát/hiện ngay lập tức.
MotionGlobalConfig.skipAnimations = true;

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
