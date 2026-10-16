import { ChartBarIcon, CheckIcon, GearSixIcon, ListChecksIcon, type Icon } from '@phosphor-icons/react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { motion, MotionConfig } from 'motion/react';
import { NavLink, Outlet, useLocation } from 'react-router';
import { kbd, softSpring, spring } from '../components/ui/styles';
import { TaskDialogHost } from '../features/tasks/TaskDialogHost';
import { useTasks } from '../hooks/useTasks';
import { useThemeEffect } from '../lib/theme';
import { useNow } from '../lib/useNow';
import { ReminderRunner } from '../notifications/ReminderRunner';
import { UpdatePrompt } from '../pwa/UpdatePrompt';

const NAV_ITEMS: { to: string; label: string; icon: Icon; end: boolean }[] = [
  { to: '/', label: 'Công việc', icon: ListChecksIcon, end: true },
  { to: '/bao-cao', label: 'Báo cáo', icon: ChartBarIcon, end: false },
  { to: '/cai-dat', label: 'Cài đặt', icon: GearSixIcon, end: false },
];

function BrandMark() {
  return (
    <span className="flex size-8 items-center justify-center rounded-[10px] bg-zinc-900 shadow-[inset_0_1px_0_rgb(255_255_255/0.12)] dark:bg-zinc-100">
      <CheckIcon weight="bold" className="size-4 text-brand-400 dark:text-brand-700" />
    </span>
  );
}

function SideNav() {
  return (
    <nav aria-label="Điều hướng chính" className="space-y-0.5">
      {NAV_ITEMS.map(({ to, label, icon: ItemIcon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200 ${
              isActive ? 'text-zinc-900 dark:text-zinc-50' : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
            }`
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <motion.span
                  layoutId="side-nav-pill"
                  transition={spring}
                  className="absolute inset-0 rounded-lg bg-white shadow-[0_1px_2px_rgb(9_9_11/0.06),0_0_0_1px_rgb(9_9_11/0.04)] dark:bg-zinc-800/80 dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.05)]"
                />
              )}
              <ItemIcon
                aria-hidden="true"
                weight={isActive ? 'duotone' : 'regular'}
                className={`relative size-[18px] ${isActive ? 'text-brand-600 dark:text-brand-400' : ''}`}
              />
              <span className="relative">{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

function BottomNav() {
  return (
    <nav
      aria-label="Điều hướng dưới"
      className="fixed inset-x-0 bottom-0 z-30 flex border-t border-zinc-200/80 bg-white/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden dark:border-zinc-800/80 dark:bg-zinc-950/85"
    >
      {NAV_ITEMS.map(({ to, label, icon: ItemIcon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
              isActive ? 'text-brand-600 dark:text-brand-400' : 'text-zinc-500 dark:text-zinc-400'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <ItemIcon aria-hidden="true" weight={isActive ? 'fill' : 'regular'} className="size-[22px]" />
              {label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

function TodayPanel() {
  const now = useNow();
  const { data: tasks = [] } = useTasks();
  const open = tasks.filter((t) => t.status !== 'done').length;
  const done = tasks.length - open;
  const ratio = tasks.length === 0 ? 0 : done / tasks.length;
  return (
    <div className="rounded-2xl border border-zinc-200/70 bg-white p-4 dark:border-zinc-800/70 dark:bg-zinc-900/60">
      <p className="text-xs text-zinc-500 first-letter:uppercase dark:text-zinc-400">
        {format(now, "EEEE, d 'tháng' M", { locale: vi })}
      </p>
      <p className="mt-2 flex items-baseline gap-1.5">
        <span className="font-mono text-2xl font-medium tracking-tight tabular-nums">{open}</span>
        <span className="text-sm text-zinc-500 dark:text-zinc-400">việc đang mở</span>
      </p>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <motion.div
          className="h-full origin-left rounded-full bg-brand-500"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: ratio }}
          transition={softSpring}
        />
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500">
        Nhấn <kbd className={kbd}>N</kbd> để thêm việc
      </p>
    </div>
  );
}

export function Layout() {
  useThemeEffect();
  const location = useLocation();
  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-dvh md:grid md:grid-cols-[256px_minmax(0,1fr)]">
        <aside className="hidden md:sticky md:top-0 md:flex md:h-dvh md:flex-col md:gap-8 md:border-r md:border-zinc-200/70 md:bg-zinc-100/40 md:px-4 md:py-6 dark:md:border-zinc-800/70 dark:md:bg-zinc-900/30">
          <div className="flex items-center gap-2.5 px-2">
            <BrandMark />
            <p className="text-[15px] font-semibold tracking-tight">Công Việc Của Tôi</p>
          </div>
          <SideNav />
          <div className="mt-auto">
            <TodayPanel />
          </div>
        </aside>

        <main className="min-w-0 px-4 pb-28 pt-5 md:px-10 md:pb-12 md:pt-10">
          <div className="mb-6 flex items-center gap-2.5 md:hidden">
            <BrandMark />
            <p className="text-[15px] font-semibold tracking-tight">Công Việc Của Tôi</p>
          </div>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={softSpring}
          >
            <Outlet />
          </motion.div>
        </main>

        <BottomNav />
        <TaskDialogHost />
        <ReminderRunner />
        <UpdatePrompt />
      </div>
    </MotionConfig>
  );
}
