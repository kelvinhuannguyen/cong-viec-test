import {
  closestCorners,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type ScreenReaderInstructions,
} from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useId } from 'react';
import { computeDrop, sortByPosition } from '../../domain/kanban';
import { STATUS_LABELS, type Label, type Task, type TaskStatus } from '../../domain/task';
import { useUpdateTasks } from '../../hooks/useTasks';
import { STATUS_DOT } from '../../lib/statusStyles';
import { DueBadge, LabelChips, PriorityBadge } from './badges';
import { useTaskDialogParam } from './useTaskDialogParam';

const COLUMN_PREFIX = 'column:';

const SCREEN_READER_INSTRUCTIONS: ScreenReaderInstructions = {
  draggable:
    'Để di chuyển thẻ, nhấn Space hoặc Enter để nhấc lên. Dùng phím mũi tên để chuyển, nhấn Space hoặc Enter để thả, nhấn Esc để huỷ.',
};

interface CardProps {
  task: Task;
  labelsById: Map<string, Label>;
  now: Date;
}

function KanbanCard({ task, labelsById, now }: CardProps) {
  const { openTask } = useTaskDialogParam();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    attributes: { roleDescription: 'thẻ có thể kéo' },
  });
  const done = task.status === 'done';
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className={`group cursor-grab rounded-xl border bg-white p-3.5 transition-[box-shadow,border-color] duration-200 active:cursor-grabbing dark:bg-zinc-900 ${
        isDragging
          ? 'z-10 border-brand-400 shadow-[0_20px_40px_-12px_rgb(9_9_11/0.3)] dark:border-brand-500'
          : 'border-zinc-200/80 shadow-[0_1px_2px_rgb(9_9_11/0.04)] hover:border-zinc-300 hover:shadow-[0_8px_24px_-12px_rgb(9_9_11/0.18)] dark:border-zinc-800 dark:hover:border-zinc-700'
      }`}
    >
      <button
        type="button"
        onClick={() => openTask(task.id)}
        // Chặn dnd-kit bắt Enter/Space trên nút để bàn phím vẫn mở được hộp thoại sửa.
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') e.stopPropagation();
        }}
        className={`text-left text-sm font-medium leading-snug tracking-tight ${
          done ? 'text-zinc-400 line-through dark:text-zinc-500' : 'text-zinc-900 hover:text-brand-700 dark:text-zinc-100 dark:hover:text-brand-300'
        }`}
      >
        {task.title}
      </button>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
        <DueBadge task={task} now={now} />
        <PriorityBadge priority={task.priority} />
        <LabelChips labelIds={task.labelIds} labelsById={labelsById} />
      </div>
    </li>
  );
}

function KanbanColumn({
  status,
  tasks,
  labelsById,
  now,
}: {
  status: TaskStatus;
  tasks: Task[];
  labelsById: Map<string, Label>;
  now: Date;
}) {
  const headingId = useId();
  const { setNodeRef, isOver } = useDroppable({ id: `${COLUMN_PREFIX}${status}` });
  return (
    <section
      aria-labelledby={headingId}
      className={`rounded-2xl border p-2 transition-colors duration-200 ${
        isOver
          ? 'border-brand-300 bg-brand-50/60 dark:border-brand-700 dark:bg-brand-950/30'
          : 'border-transparent bg-zinc-100/70 dark:bg-zinc-900/50'
      }`}
    >
      <header className="flex items-center gap-2 px-2 pb-3 pt-1.5">
        <span
          className={`size-2 rounded-full ${STATUS_DOT[status]} ${status === 'in_progress' ? 'animate-breathe' : ''}`}
          aria-hidden="true"
        />
        <h2 id={headingId} className="text-sm font-semibold tracking-tight">
          {STATUS_LABELS[status]}
        </h2>
        <span
          className="ml-auto rounded-full bg-white px-2 py-0.5 font-mono text-xs tabular-nums text-zinc-500 shadow-[0_0_0_1px_rgb(9_9_11/0.05)] dark:bg-zinc-800 dark:text-zinc-400"
          aria-label={`${tasks.length} việc`}
        >
          {tasks.length}
        </span>
      </header>
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <ul ref={setNodeRef} className="flex min-h-32 flex-col gap-2">
          {tasks.map((task) => (
            <KanbanCard key={task.id} task={task} labelsById={labelsById} now={now} />
          ))}
          {tasks.length === 0 && (
            <li
              aria-hidden="true"
              className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-zinc-300/80 py-8 text-xs text-zinc-400 dark:border-zinc-700 dark:text-zinc-500"
            >
              Thả thẻ vào đây
            </li>
          )}
        </ul>
      </SortableContext>
    </section>
  );
}

export function KanbanBoard({
  allTasks,
  visibleTasks,
  statuses,
  labelsById,
  now,
}: {
  allTasks: Task[];
  visibleTasks: Task[];
  statuses: TaskStatus[];
  labelsById: Map<string, Label>;
  now: Date;
}) {
  const updateTasks = useUpdateTasks();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const titleOf = (id: string | number) => allTasks.find((t) => t.id === String(id))?.title ?? String(id);
  const targetOf = (id: string | number) => {
    const key = String(id);
    return key.startsWith(COLUMN_PREFIX)
      ? `cột ${STATUS_LABELS[key.slice(COLUMN_PREFIX.length) as TaskStatus]}`
      : `thẻ ${titleOf(key)}`;
  };
  const announcements: Announcements = {
    onDragStart: ({ active }) => `Đã nhấc thẻ ${titleOf(active.id)}.`,
    onDragOver: ({ active, over }) =>
      over ? `Thẻ ${titleOf(active.id)} đang ở trên ${targetOf(over.id)}.` : `Thẻ ${titleOf(active.id)} không ở trên vị trí thả nào.`,
    onDragEnd: ({ active, over }) =>
      over ? `Đã thả thẻ ${titleOf(active.id)} vào ${targetOf(over.id)}.` : `Đã thả thẻ ${titleOf(active.id)}.`,
    onDragCancel: ({ active }) => `Đã huỷ kéo thẻ ${titleOf(active.id)}.`,
  };

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const overId = String(over.id);
    let targetStatus: TaskStatus;
    let overTaskId: string | null;
    if (overId.startsWith(COLUMN_PREFIX)) {
      targetStatus = overId.slice(COLUMN_PREFIX.length) as TaskStatus;
      overTaskId = null;
    } else {
      const overTask = allTasks.find((t) => t.id === overId);
      if (!overTask) return;
      targetStatus = overTask.status;
      overTaskId = overTask.id;
    }
    // Tính trên toàn bộ việc (không chỉ việc đang hiện) để position không bị trùng.
    const updates = computeDrop(allTasks, String(active.id), targetStatus, overTaskId);
    if (updates.length > 0) updateTasks.mutate(updates);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragEnd={handleDragEnd}
      accessibility={{ screenReaderInstructions: SCREEN_READER_INSTRUCTIONS, announcements }}
    >
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {statuses.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            tasks={sortByPosition(visibleTasks.filter((t) => t.status === status))}
            labelsById={labelsById}
            now={now}
          />
        ))}
      </div>
    </DndContext>
  );
}
