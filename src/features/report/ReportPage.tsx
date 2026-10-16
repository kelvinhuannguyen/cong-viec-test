import { useId, useMemo, useState, type ReactNode } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { card } from '../../components/ui/styles';
import { completionsByDay, completionsByWeek, dueSoonTasks, overdueTasks, summarize } from '../../domain/stats';
import { STATUS_LABELS, TASK_STATUSES, type Task, type TaskStatus } from '../../domain/task';
import { useTasks } from '../../hooks/useTasks';
import { formatDueLabel } from '../../lib/format';
import { useNow } from '../../lib/useNow';
import { useTaskDialogParam } from '../tasks/useTaskDialogParam';

const STATUS_COLORS: Record<TaskStatus, string> = {
  todo: '#94a3b8',
  in_progress: '#3b82f6',
  done: '#22c55e',
  on_hold: '#f59e0b',
};

function StatCard({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div role="group" aria-label={label} className={card}>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

function Panel({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className={card}>
      <header className="mb-3 flex items-center justify-between gap-2">
        <h2 id={id} className="font-semibold">
          {title}
        </h2>
        {action}
      </header>
      {children}
    </section>
  );
}

function TaskLinkList({
  tasks,
  now,
  empty,
  onOpen,
}: {
  tasks: Task[];
  now: Date;
  empty: string;
  onOpen: (id: string) => void;
}) {
  if (tasks.length === 0) return <p className="text-sm text-slate-500">{empty}</p>;
  return (
    <ul className="space-y-1">
      {tasks.map((task) => (
        <li key={task.id}>
          <button
            type="button"
            onClick={() => onOpen(task.id)}
            className="flex w-full justify-between gap-3 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <span className="truncate">{task.title}</span>
            <span className="shrink-0 text-slate-500">{formatDueLabel(task.dueAt!, now)}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

export function ReportPage() {
  const { data: tasks = [] } = useTasks();
  const now = useNow();
  const { openTask } = useTaskDialogParam();
  const [range, setRange] = useState<'day' | 'week'>('day');

  const summary = useMemo(() => summarize(tasks), [tasks]);
  const buckets = useMemo(
    () => (range === 'day' ? completionsByDay(tasks, now) : completionsByWeek(tasks, now)),
    [tasks, now, range],
  );
  const overdue = useMemo(() => overdueTasks(tasks, now), [tasks, now]);
  const soon = useMemo(() => dueSoonTasks(tasks, now), [tasks, now]);
  const pieData = TASK_STATUSES.map((s) => ({ status: s, name: STATUS_LABELS[s], value: summary.byStatus[s] })).filter(
    (d) => d.value > 0,
  );

  const rangeToggle = (
    <div className="inline-flex overflow-hidden rounded-lg border border-slate-300 text-sm dark:border-slate-700">
      {(
        [
          ['day', '7 ngày'],
          ['week', '8 tuần'],
        ] as const
      ).map(([value, label]) => (
        <button
          key={value}
          type="button"
          aria-pressed={range === value}
          onClick={() => setRange(value)}
          className={`px-3 py-1 ${range === value ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
        >
          {label}
        </button>
      ))}
    </div>
  );

  return (
    <section className="mx-auto max-w-5xl space-y-6">
      <h1 className="text-2xl font-bold">Báo cáo</h1>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Tổng" value={summary.total} />
        <StatCard label="Đang làm" value={summary.byStatus.in_progress} />
        <StatCard label="Đã xong" value={summary.byStatus.done} />
        <StatCard label="Tỉ lệ hoàn thành" value={`${summary.completionRate}%`} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="Phân bổ trạng thái">
          {pieData.length === 0 ? (
            <p className="text-sm text-slate-500">Chưa có dữ liệu</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90}>
                  {pieData.map((d) => (
                    <Cell key={d.status} fill={STATUS_COLORS[d.status]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Panel>
        <Panel title="Việc hoàn thành theo thời gian" action={rangeToggle}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={buckets}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" name="Việc hoàn thành" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Panel title={`Trễ hạn (${overdue.length})`}>
          <TaskLinkList tasks={overdue} now={now} empty="Không có việc trễ hạn" onOpen={openTask} />
        </Panel>
        <Panel title={`Sắp đến hạn (${soon.length})`}>
          <TaskLinkList tasks={soon} now={now} empty="Không có việc sắp đến hạn" onOpen={openTask} />
        </Panel>
      </div>
    </section>
  );
}
