import { useId, useMemo, useRef } from 'react';
import { btn, field } from '../../components/ui/styles';
import { countByStatus, filterByStatus, searchTasks, sortTasks, type SortKey } from '../../domain/query';
import { useLabels } from '../../hooks/useLabels';
import { useTasks } from '../../hooks/useTasks';
import { useNewTaskShortcut } from '../../lib/keyboard';
import { useNow } from '../../lib/useNow';
import { EmptyState } from './EmptyState';
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
  const { data: tasks = [], isPending } = useTasks();
  const { data: labels = [] } = useLabels();
  const { status, q, sort, setStatus, setQuery, setSort, clearFilters } = useTaskUrlState();
  const { openNew } = useTaskDialogParam();
  // Ô tìm kiếm không điều khiển (uncontrolled) để gõ nhanh không mất ký tự khi URL cập nhật trễ.
  const searchRef = useRef<HTMLInputElement>(null);
  const now = useNow();
  useNewTaskShortcut(openNew);

  const searched = useMemo(() => searchTasks(tasks, q), [tasks, q]);
  const counts = useMemo(() => countByStatus(searched), [searched]);
  const visible = useMemo(() => sortTasks(filterByStatus(searched, status), sort), [searched, status, sort]);
  const labelsById = useMemo(() => new Map(labels.map((l) => [l.id, l])), [labels]);

  function handleClear() {
    clearFilters();
    if (searchRef.current) searchRef.current.value = '';
  }

  return (
    <section className="mx-auto max-w-4xl space-y-4">
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

      <StatusFilterBar value={status} counts={counts} onChange={setStatus} />

      <div className="flex items-center gap-2 text-sm">
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
      </div>

      <QuickAdd />

      {isPending ? (
        <p className="text-slate-500">Đang tải…</p>
      ) : tasks.length === 0 ? (
        <EmptyState title="Chưa có công việc nào" actionLabel="Thêm việc đầu tiên" onAction={openNew} />
      ) : visible.length === 0 ? (
        <EmptyState title="Không có việc nào khớp bộ lọc" actionLabel="Xoá bộ lọc" onAction={handleClear} />
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
