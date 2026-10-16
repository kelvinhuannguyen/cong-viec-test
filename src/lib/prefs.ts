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
    // Bộ nhớ bị chặn: tuỳ chọn không được lưu và giao diện sẽ không đổi theo.
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
