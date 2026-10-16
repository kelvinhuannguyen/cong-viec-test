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
