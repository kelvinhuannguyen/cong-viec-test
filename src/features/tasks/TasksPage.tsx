import { btn } from '../../components/ui/styles';
import { useTasks } from '../../hooks/useTasks';
import { QuickAdd } from './QuickAdd';
import { useTaskDialogParam } from './useTaskDialogParam';

export function TasksPage() {
  const { data: tasks = [] } = useTasks();
  const { openNew, openTask } = useTaskDialogParam();
  return (
    <section className="mx-auto max-w-4xl space-y-4">
      <header className="flex items-center gap-3">
        <h1 className="mr-auto text-2xl font-bold">Công việc</h1>
        <button type="button" className={btn.primary} onClick={openNew}>
          + Thêm
        </button>
      </header>
      <QuickAdd />
      <ul className="space-y-2">
        {tasks.map((t) => (
          <li key={t.id}>
            <button type="button" onClick={() => openTask(t.id)}>
              {t.title}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
