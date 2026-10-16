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
