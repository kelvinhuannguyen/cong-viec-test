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
