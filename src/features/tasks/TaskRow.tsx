import { useEffect, useRef, useState } from 'react';
import { btn, field } from '../../components/ui/styles';
import { STATUS_LABELS, TASK_STATUSES, type Label, type Task, type TaskStatus } from '../../domain/task';
import { useDeleteTask, useUpdateTasks } from '../../hooks/useTasks';
import { DueBadge, LabelChips, PriorityBadge } from './badges';
import { useTaskDialogParam } from './useTaskDialogParam';

function RowMenu({ title, onEdit, onDelete }: { title: string; onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        className={btn.ghost}
        aria-label={`Thao tác khác cho "${title}"`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        ⋯
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-10 mt-1 w-32 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900"
        >
          <button
            type="button"
            role="menuitem"
            className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
          >
            Sửa
          </button>
          <button
            type="button"
            role="menuitem"
            className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
          >
            Xoá
          </button>
        </div>
      )}
    </div>
  );
}

export function TaskRow({ task, labelsById, now }: { task: Task; labelsById: Map<string, Label>; now: Date }) {
  const updateTasks = useUpdateTasks();
  const deleteTask = useDeleteTask();
  const { openTask } = useTaskDialogParam();
  const setStatus = (status: TaskStatus) => updateTasks.mutate([{ id: task.id, patch: { status } }]);
  const done = task.status === 'done';

  return (
    <li className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
      <input
        type="checkbox"
        className="size-5 accent-blue-600"
        aria-label={`Đánh dấu "${task.title}" đã xong`}
        checked={done}
        onChange={(e) => setStatus(e.target.checked ? 'done' : 'todo')}
      />
      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={() => openTask(task.id)}
          className={`text-left font-medium hover:underline ${done ? 'text-slate-400 line-through' : ''}`}
        >
          {task.title}
        </button>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
          <LabelChips labelIds={task.labelIds} labelsById={labelsById} />
          <PriorityBadge priority={task.priority} />
          <DueBadge task={task} now={now} />
        </div>
      </div>
      <select
        aria-label={`Trạng thái của "${task.title}"`}
        className={`${field} w-auto`}
        value={task.status}
        onChange={(e) => setStatus(e.target.value as TaskStatus)}
      >
        {TASK_STATUSES.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABELS[s]}
          </option>
        ))}
      </select>
      <RowMenu title={task.title} onEdit={() => openTask(task.id)} onDelete={() => deleteTask.mutate(task)} />
    </li>
  );
}
