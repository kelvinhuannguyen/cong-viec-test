import { ArrowClockwiseIcon, KanbanIcon, ListBulletsIcon, MagnifyingGlassIcon, PlusIcon, WarningOctagonIcon } from '@phosphor-icons/react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useId, useMemo, useRef } from 'react';
import { TaskListSkeleton } from '../../components/ui/Skeleton';
import { btn, field, softSpring, spring } from '../../components/ui/styles';
import { countByStatus, filterByStatus, searchTasks, sortTasks, type SortKey } from '../../domain/query';
import { KANBAN_COLUMNS } from '../../domain/task';
import { useLabels } from '../../hooks/useLabels';
import { useTasks } from '../../hooks/useTasks';
import { LOAD_ERROR } from '../../lib/errors';
import { useNewTaskShortcut } from '../../lib/keyboard';
import { PREF_KEYS, usePref } from '../../lib/prefs';
import { useNow } from '../../lib/useNow';
import { ReminderBanner } from '../../notifications/ReminderBanner';
import { EmptyState } from './EmptyState';
import { KanbanBoard } from './KanbanBoard';
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

const VIEW_OPTIONS = [
  { value: 'list', label: 'Danh sách', icon: ListBulletsIcon },
  { value: 'kanban', label: 'Kanban', icon: KanbanIcon },
] as const;

function ProgressLine({ done, total }: { done: number; total: number }) {
  const ratio = total === 0 ? 0 : done / total;
  return (
    <div className="mt-4 flex max-w-sm items-center gap-3">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-200/70 dark:bg-zinc-800">
        <motion.div
          className="h-full origin-left rounded-full bg-brand-500"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: ratio }}
          transition={softSpring}
        />
      </div>
      <p className="shrink-0 text-xs text-zinc-500 dark:text-zinc-400">
        <span className="font-mono tabular-nums text-zinc-900 dark:text-zinc-100">
          {done}/{total}
        </span>{' '}
        đã xong
      </p>
    </div>
  );
}

export function TasksPage() {
  const sortId = useId();
  const tasksQuery = useTasks();
  const tasks = tasksQuery.data ?? [];
  // Lỗi khi đọc lại ngầm (đã có dữ liệu) thì vẫn hiện danh sách cũ thay vì che bằng thông báo lỗi.
  const loadFailed = tasksQuery.isError && tasksQuery.data === undefined;
  const { data: labels = [] } = useLabels();
  const { status, q, sort, setStatus, setQuery, setSort, clearFilters } = useTaskUrlState();
  const { openNew } = useTaskDialogParam();
  const [storedView, setView] = usePref<string>(PREF_KEYS.view, 'list');
  const view: 'list' | 'kanban' = storedView === 'kanban' ? 'kanban' : 'list';
  // Ô tìm kiếm không điều khiển (uncontrolled) để gõ nhanh không mất ký tự khi URL cập nhật trễ.
  const searchRef = useRef<HTMLInputElement>(null);
  const now = useNow();
  useNewTaskShortcut(openNew);

  // Đồng bộ ô tìm kiếm khi `q` đổi từ bên ngoài (nav, back/forward), trừ khi người dùng đang gõ.
  useEffect(() => {
    const input = searchRef.current;
    if (input && document.activeElement !== input && input.value !== q) input.value = q;
  }, [q]);

  const searched = useMemo(() => searchTasks(tasks, q), [tasks, q]);
  const counts = useMemo(() => countByStatus(searched), [searched]);
  const visible = useMemo(() => sortTasks(filterByStatus(searched, status), sort), [searched, status, sort]);
  const labelsById = useMemo(() => new Map(labels.map((l) => [l.id, l])), [labels]);
  const doneCount = useMemo(() => tasks.filter((t) => t.status === 'done').length, [tasks]);
  const noMatches = view === 'list' ? visible.length === 0 : searched.length === 0;

  function handleClear() {
    clearFilters();
    if (searchRef.current) searchRef.current.value = '';
  }

  return (
    <section className={`mx-auto space-y-6 ${view === 'kanban' ? 'max-w-7xl' : 'max-w-4xl'}`}>
      <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm text-zinc-500 first-letter:uppercase dark:text-zinc-400">
            {format(now, "EEEE, d 'tháng' M", { locale: vi })}
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tighter md:text-4xl">Công việc</h1>
          <ProgressLine done={doneCount} total={tasks.length} />
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:w-64 md:flex-none">
            <MagnifyingGlassIcon
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400"
              aria-hidden="true"
            />
            <input
              ref={searchRef}
              type="search"
              aria-label="Tìm công việc"
              placeholder="Tìm việc..."
              className={`${field} w-full pl-9`}
              defaultValue={q}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button type="button" className={btn.primary} onClick={openNew}>
            <PlusIcon weight="bold" className="size-4" aria-hidden="true" />
            Thêm việc
            <kbd aria-hidden="true" className="ml-1 hidden rounded border border-white/25 px-1 font-mono text-[10px] leading-4 text-white/80 md:inline dark:border-brand-950/25 dark:text-brand-950/70">
              N
            </kbd>
          </button>
        </div>
      </header>

      <ReminderBanner tasks={tasks} now={now} />

      <StatusFilterBar value={status} counts={counts} onChange={setStatus} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <QuickAdd />
        </div>
        <div className="flex shrink-0 items-center gap-2 whitespace-nowrap">
          <div
            role="group"
            aria-label="Chế độ xem"
            className="inline-flex h-10 items-center rounded-xl border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-900"
          >
            {VIEW_OPTIONS.map(({ value, label, icon: ViewIcon }) => (
              <button
                key={value}
                type="button"
                aria-pressed={view === value}
                onClick={() => setView(value)}
                className={`relative flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors ${
                  view === value ? 'text-zinc-900 dark:text-zinc-50' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                {view === value && (
                  <motion.span
                    layoutId="view-toggle-pill"
                    transition={spring}
                    className="absolute inset-0 rounded-md bg-zinc-100 dark:bg-zinc-800"
                  />
                )}
                <ViewIcon className="relative size-3.5" aria-hidden="true" />
                <span className="relative">{label}</span>
              </button>
            ))}
          </div>
          {view === 'list' && (
            <div className="flex items-center gap-2">
              <label htmlFor={sortId} className="sr-only">
                Sắp xếp
              </label>
              <select
                id={sortId}
                className={`${field} h-10 w-auto rounded-xl pr-8 text-xs`}
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
          )}
        </div>
      </div>

      {loadFailed ? (
        <div
          role="alert"
          className="flex flex-col items-start gap-4 rounded-3xl border border-rose-200 bg-rose-50/60 p-6 sm:flex-row sm:items-center dark:border-rose-500/20 dark:bg-rose-500/5"
        >
          <WarningOctagonIcon className="size-8 shrink-0 text-rose-500" aria-hidden="true" />
          <p className="flex-1 text-sm text-rose-800 dark:text-rose-200">{LOAD_ERROR}</p>
          <button type="button" className={btn.secondary} onClick={() => window.location.reload()}>
            <ArrowClockwiseIcon className="size-4" aria-hidden="true" />
            Tải lại
          </button>
        </div>
      ) : tasksQuery.isPending ? (
        <TaskListSkeleton />
      ) : tasks.length === 0 ? (
        <EmptyState
          title="Chưa có công việc nào"
          description="Ghi lại việc đầu tiên bạn cần làm. Gõ vào ô thêm nhanh ở trên, hoặc nhấn N ở bất kỳ đâu."
          actionLabel="Thêm việc đầu tiên"
          onAction={openNew}
        />
      ) : noMatches ? (
        <EmptyState
          variant="filtered"
          title="Không có việc nào khớp bộ lọc"
          description="Thử từ khoá khác hoặc chọn trạng thái khác."
          actionLabel="Xoá bộ lọc"
          onAction={handleClear}
        />
      ) : view === 'kanban' ? (
        <KanbanBoard
          allTasks={tasks}
          visibleTasks={searched}
          statuses={status === 'all' ? KANBAN_COLUMNS : [status]}
          labelsById={labelsById}
          now={now}
        />
      ) : (
        <ul
          aria-label="Danh sách công việc"
          className="divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-200/70 bg-white shadow-[0_1px_2px_rgb(9_9_11/0.03),0_16px_40px_-28px_rgb(9_9_11/0.15)] dark:divide-zinc-800/70 dark:border-zinc-800/70 dark:bg-zinc-900/40 dark:shadow-none"
        >
          <AnimatePresence>
            {visible.map((task, index) => (
              <TaskRow key={task.id} task={task} labelsById={labelsById} now={now} index={index} />
            ))}
          </AnimatePresence>
        </ul>
      )}
    </section>
  );
}
