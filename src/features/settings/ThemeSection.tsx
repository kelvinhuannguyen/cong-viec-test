import { DesktopIcon, MoonIcon, SunIcon, type Icon } from '@phosphor-icons/react';
import { motion } from 'motion/react';
import { spring } from '../../components/ui/styles';
import { PREF_KEYS, usePref } from '../../lib/prefs';
import type { ThemePref } from '../../lib/theme';

const OPTIONS: { value: ThemePref; label: string; icon: Icon }[] = [
  { value: 'light', label: 'Sáng', icon: SunIcon },
  { value: 'dark', label: 'Tối', icon: MoonIcon },
  { value: 'system', label: 'Theo hệ thống', icon: DesktopIcon },
];

export function ThemeSection() {
  const [theme, setTheme] = usePref<ThemePref>(PREF_KEYS.theme, 'system');
  return (
    <fieldset className="inline-flex flex-wrap gap-1 rounded-xl border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-900">
      <legend className="sr-only">Chọn giao diện</legend>
      {OPTIONS.map(({ value, label, icon: OptionIcon }) => {
        const active = theme === value;
        return (
          <label
            key={value}
            className={`relative flex cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-brand-500/20 ${
              active ? 'text-zinc-900 dark:text-zinc-50' : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
            }`}
          >
            {active && (
              <motion.span layoutId="theme-pill" transition={spring} className="absolute inset-0 rounded-lg bg-zinc-100 dark:bg-zinc-800" />
            )}
            <input type="radio" name="theme" value={value} checked={active} onChange={() => setTheme(value)} className="sr-only" />
            <OptionIcon weight={active ? 'fill' : 'regular'} className="relative size-4" aria-hidden="true" />
            <span className="relative">{label}</span>
          </label>
        );
      })}
    </fieldset>
  );
}
