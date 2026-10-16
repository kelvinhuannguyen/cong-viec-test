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
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className={`cursor-grab rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800 ${
        isDragging ? 'opacity-60' : ''
      }`}
    >
      <button
        type="button"
        onClick={() => openTask(task.id)}
        // Chặn dnd-kit bắt Enter/Space trên nút để bàn phím vẫn mở được hộp thoại sửa.
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') e.stopPropagation();
        }}
        className="text-left font-medium hover:underline"
      >
        {task.title}
      </button>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
        <LabelChips labelIds={task.labelIds} labelsById={labelsById} />
        <PriorityBadge priority={task.priority} />
        <DueBadge task={task} now={now} />
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
      className={`rounded-2xl bg-slate-100 p-3 dark:bg-slate-900 ${isOver ? 'ring-2 ring-blue-400' : ''}`}
    >
      <header className="mb-3 flex items-center justify-between">
        <h2 id={headingId} className="font-semibold">
          {STATUS_LABELS[status]}
        </h2>
        <span className="text-sm text-slate-500" aria-label={`${tasks.length} việc`}>
          {tasks.length}
        </span>
      </header>
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <ul ref={setNodeRef} className="min-h-24 space-y-2">
          {tasks.map((task) => (
            <KanbanCard key={task.id} task={task} labelsById={labelsById} now={now} />
          ))}
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
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
