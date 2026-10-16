import { CaretDownIcon, DotsThreeIcon, PencilSimpleIcon, TrashIcon } from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { Checkbox } from '../../components/ui/Checkbox';
import { btn, spring } from '../../components/ui/styles';
import { STATUS_LABELS, TASK_STATUSES, type Label, type Task, type TaskStatus } from '../../domain/task';
import { useDeleteTask, useUpdateTasks } from '../../hooks/useTasks';
import { STATUS_DOT } from '../../lib/statusStyles';
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

  const item =
    'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors active:scale-[0.98]';

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        className={`${btn.icon} opacity-60 group-hover:opacity-100 focus-visible:opacity-100 aria-expanded:opacity-100`}
        aria-label={`Thao tác khác cho "${title}"`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <DotsThreeIcon weight="bold" className="size-[18px]" aria-hidden="true" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={spring}
            className="absolute right-0 z-20 mt-1 w-40 origin-top-right rounded-xl border border-zinc-200/80 bg-white p-1 shadow-[0_12px_32px_-12px_rgb(9_9_11/0.25)] dark:border-zinc-800 dark:bg-zinc-900"
          >
            <button
              type="button"
              role="menuitem"
              className={`${item} hover:bg-zinc-100 dark:hover:bg-zinc-800`}
              onClick={() => {
                setOpen(false);
                onEdit();
              }}
            >
              <PencilSimpleIcon className="size-4 text-zinc-500" aria-hidden="true" />
              Sửa
            </button>
            <button
              type="button"
              role="menuitem"
              className={`${item} text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10`}
              onClick={() => {
                setOpen(false);
                onDelete();
              }}
            >
              <TrashIcon className="size-4" aria-hidden="true" />
              Xoá
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function StatusSelect({ title, status, onChange }: { title: string; status: TaskStatus; onChange: (s: TaskStatus) => void }) {
  return (
    <span className="relative inline-flex shrink-0 items-center">
      <span
        className={`pointer-events-none absolute left-2.5 size-1.5 rounded-full ${STATUS_DOT[status]} ${
          status === 'in_progress' ? 'animate-breathe' : ''
        }`}
        aria-hidden="true"
      />
      <select
        aria-label={`Trạng thái của "${title}"`}
        value={status}
        onChange={(e) => onChange(e.target.value as TaskStatus)}
        className="h-7 cursor-pointer appearance-none rounded-full border border-zinc-200 bg-white pl-6 pr-7 text-xs font-medium text-zinc-700 transition-colors hover:border-zinc-300 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15 dark:border-zinc-700/80 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-600"
      >
        {TASK_STATUSES.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABELS[s]}
          </option>
        ))}
      </select>
      <CaretDownIcon className="pointer-events-none absolute right-2.5 size-3 text-zinc-400" aria-hidden="true" />
    </span>
  );
}

export function TaskRow({
  task,
  labelsById,
  now,
  index = 0,
}: {
  task: Task;
  labelsById: Map<string, Label>;
  now: Date;
  index?: number;
}) {
  const updateTasks = useUpdateTasks();
  const deleteTask = useDeleteTask();
  const { openTask } = useTaskDialogParam();
  const setStatus = (status: TaskStatus) => updateTasks.mutate([{ id: task.id, patch: { status } }]);
  const done = task.status === 'done';
  const hasMeta = task.labelIds.length > 0 || task.dueAt !== null || task.priority !== 'medium';

  return (
    <motion.li
      layout="position"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -16, transition: { duration: 0.18 } }}
      transition={{ ...spring, delay: Math.min(index, 8) * 0.03 }}
      className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/30"
    >
      <Checkbox
        label={`Đánh dấu "${task.title}" đã xong`}
        checked={done}
        onChange={(checked) => setStatus(checked ? 'done' : 'todo')}
      />
      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={() => openTask(task.id)}
          className={`block max-w-full truncate text-left text-[15px] font-medium tracking-tight transition-colors ${
            done
              ? 'text-zinc-400 line-through decoration-zinc-300 dark:text-zinc-500 dark:decoration-zinc-600'
              : 'text-zinc-900 hover:text-brand-700 dark:text-zinc-100 dark:hover:text-brand-300'
          }`}
        >
          {task.title}
        </button>
        {hasMeta && (
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            <DueBadge task={task} now={now} />
            <PriorityBadge priority={task.priority} />
            <LabelChips labelIds={task.labelIds} labelsById={labelsById} />
          </div>
        )}
      </div>
      <StatusSelect title={task.title} status={task.status} onChange={setStatus} />
      <RowMenu title={task.title} onEdit={() => openTask(task.id)} onDelete={() => deleteTask.mutate(task)} />
    </motion.li>
  );
}
