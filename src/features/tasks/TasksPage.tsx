import { useEffect, useId, useMemo, useRef } from 'react';
import { btn, field } from '../../components/ui/styles';
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

export function TasksPage() {
  const sortId = useId();
  const { data: tasks = [], isPending, isError } = useTasks();
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
  const noMatches = view === 'list' ? visible.length === 0 : searched.length === 0;

  function handleClear() {
    clearFilters();
    if (searchRef.current) searchRef.current.value = '';
  }

  return (
    <section className={`mx-auto space-y-4 ${view === 'kanban' ? 'max-w-6xl' : 'max-w-4xl'}`}>
      <header className="flex flex-wrap items-center gap-3">
        <h1 className="mr-auto text-2xl font-bold">Công việc</h1>
        <input
          ref={searchRef}
          type="search"
          aria-label="Tìm công việc"
          placeholder="Tìm việc..."
          className={`${field} w-full sm:w-56`}
          defaultValue={q}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="button" className={btn.primary} onClick={openNew}>
          + Thêm
        </button>
      </header>
      <ReminderBanner tasks={tasks} now={now} />

      <StatusFilterBar value={status} counts={counts} onChange={setStatus} />

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <div role="group" aria-label="Chế độ xem" className="inline-flex overflow-hidden rounded-lg border border-slate-300 dark:border-slate-700">
          {(['list', 'kanban'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              aria-pressed={view === mode}
              onClick={() => setView(mode)}
              className={`px-3 py-1.5 ${view === mode ? 'bg-blue-600 text-white' : 'bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800'}`}
            >
              {mode === 'list' ? 'Danh sách' : 'Kanban'}
            </button>
          ))}
        </div>
        {view === 'list' && (
          <>
            <label htmlFor={sortId}>Sắp xếp</label>
            <select
              id={sortId}
              className={`${field} w-auto`}
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </>
        )}
      </div>

      <QuickAdd />

      {isError ? (
        <div role="alert" className="space-y-3 rounded-2xl border border-red-300 p-6 text-center text-red-700 dark:border-red-800 dark:text-red-400">
          <p>{LOAD_ERROR}</p>
          <button type="button" className={btn.secondary} onClick={() => window.location.reload()}>
            Tải lại
          </button>
        </div>
      ) : isPending ? (
        <p className="text-slate-500">Đang tải…</p>
      ) : tasks.length === 0 ? (
        <EmptyState title="Chưa có công việc nào" actionLabel="Thêm việc đầu tiên" onAction={openNew} />
      ) : noMatches ? (
        <EmptyState title="Không có việc nào khớp bộ lọc" actionLabel="Xoá bộ lọc" onAction={handleClear} />
      ) : view === 'kanban' ? (
        <KanbanBoard
          allTasks={tasks}
          visibleTasks={searched}
          statuses={status === 'all' ? KANBAN_COLUMNS : [status]}
          labelsById={labelsById}
          now={now}
        />
      ) : (
        <ul aria-label="Danh sách công việc" className="space-y-2">
          {visible.map((task) => (
            <TaskRow key={task.id} task={task} labelsById={labelsById} now={now} />
          ))}
        </ul>
      )}
    </section>
  );
}
