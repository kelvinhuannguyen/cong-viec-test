import { CalendarCheckIcon, CheckCircleIcon, HourglassMediumIcon, StackIcon, SunHorizonIcon, WarningCircleIcon, type Icon } from '@phosphor-icons/react';
import { dailySummary } from '../../domain/reminders';
import { motion } from 'motion/react';
import { useId, useMemo, useState, type ReactNode } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { softSpring, spring } from '../../components/ui/styles';
import { completionsByDay, completionsByWeek, dueSoonTasks, overdueTasks, summarize } from '../../domain/stats';
import { STATUS_LABELS, TASK_STATUSES, type Task } from '../../domain/task';
import { useTasks } from '../../hooks/useTasks';
import { formatDueLabel } from '../../lib/format';
import { STATUS_DOT, STATUS_HEX } from '../../lib/statusStyles';
import { useNow } from '../../lib/useNow';
import { useTaskDialogParam } from '../tasks/useTaskDialogParam';

const tile =
  'rounded-3xl border border-zinc-200/70 bg-white shadow-[0_1px_2px_rgb(9_9_11/0.03),0_16px_40px_-28px_rgb(9_9_11/0.15)] dark:border-zinc-800/70 dark:bg-zinc-900/50 dark:shadow-none';

const tooltipStyle = {
  contentStyle: {
    background: 'rgb(24 24 27)',
    border: '1px solid rgb(63 63 70)',
    borderRadius: 12,
    color: '#fafafa',
    fontSize: 12,
    boxShadow: '0 12px 32px -12px rgb(0 0 0 / 0.5)',
  },
  itemStyle: { color: '#fafafa' },
  labelStyle: { color: '#a1a1aa', marginBottom: 2 },
  cursor: { fill: 'rgb(161 161 170 / 0.12)' },
};

function Reveal({ index, className, children }: { index: number; className: string; children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...softSpring, delay: index * 0.06 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function CompletionRing({ rate, done, total }: { rate: number; done: number; total: number }) {
  const radius = 56;
  return (
    <div role="group" aria-label="Tỉ lệ hoàn thành" className="flex h-full flex-col justify-between gap-6 p-6">
      <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Tỉ lệ hoàn thành</p>
      <div className="flex items-center gap-6">
        <div className="relative size-36 shrink-0">
          <svg viewBox="0 0 140 140" className="size-full -rotate-90" aria-hidden="true">
            <circle cx="70" cy="70" r={radius} fill="none" strokeWidth="12" className="stroke-zinc-100 dark:stroke-zinc-800" />
            <motion.circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              strokeWidth="12"
              strokeLinecap="round"
              className="stroke-brand-500"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: rate / 100 }}
              transition={{ ...softSpring, delay: 0.15 }}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center font-mono text-3xl font-medium tracking-tighter tabular-nums">
            {rate}%
          </span>
        </div>
        <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          <span className="font-mono text-zinc-900 tabular-nums dark:text-zinc-100">{done}</span> trên{' '}
          <span className="font-mono text-zinc-900 tabular-nums dark:text-zinc-100">{total}</span> việc đã xong.
        </p>
      </div>
    </div>
  );
}

function StatTile({ label, value, icon: TileIcon, tone }: { label: string; value: number; icon: Icon; tone: string }) {
  return (
    <div role="group" aria-label={label} className="flex h-full flex-col justify-between gap-4 p-5">
      <span className={`flex size-9 items-center justify-center rounded-xl ${tone}`}>
        <TileIcon className="size-[18px]" aria-hidden="true" />
      </span>
      <div>
        <p className="font-mono text-3xl font-medium tracking-tighter tabular-nums">{value}</p>
        <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
      </div>
    </div>
  );
}

function Panel({ title, icon: PanelIcon, action, children }: { title: string; icon?: Icon; action?: ReactNode; children: ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="flex h-full flex-col p-6">
      <header className="mb-4 flex items-center justify-between gap-2">
        <h2 id={id} className="flex items-center gap-2 text-sm font-semibold tracking-tight">
          {PanelIcon && <PanelIcon className="size-4 text-zinc-400" aria-hidden="true" />}
          {title}
        </h2>
        {action}
      </header>
      <div className="flex-1">{children}</div>
    </section>
  );
}

function TaskLinkList({
  tasks,
  now,
  empty,
  tone,
  onOpen,
}: {
  tasks: Task[];
  now: Date;
  empty: string;
  tone: string;
  onOpen: (id: string) => void;
}) {
  if (tasks.length === 0) {
    return (
      <p className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
        <CheckCircleIcon className="size-4 text-brand-500" aria-hidden="true" />
        {empty}
      </p>
    );
  }
  return (
    <ul className="-mx-2 space-y-0.5">
      {tasks.map((task) => (
        <li key={task.id}>
          <button
            type="button"
            onClick={() => onOpen(task.id)}
            className="flex w-full items-center justify-between gap-3 rounded-xl px-2 py-2 text-left text-sm transition-colors hover:bg-zinc-100 active:scale-[0.99] dark:hover:bg-zinc-800/70"
          >
            <span className="truncate font-medium">{task.title}</span>
            <span className={`shrink-0 font-mono text-xs tabular-nums ${tone}`}>{formatDueLabel(task.dueAt!, now)}</span>
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
  const today = useMemo(() => dailySummary(tasks, now), [tasks, now]);
  const pieData = TASK_STATUSES.map((s) => ({ status: s, name: STATUS_LABELS[s], value: summary.byStatus[s] })).filter(
    (d) => d.value > 0,
  );

  const rangeToggle = (
    <div className="inline-flex rounded-lg border border-zinc-200 bg-white p-0.5 text-xs dark:border-zinc-800 dark:bg-zinc-900">
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
          className={`relative h-6 rounded-md px-2.5 font-medium transition-colors ${
            range === value ? 'text-zinc-900 dark:text-zinc-50' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          {range === value && (
            <motion.span layoutId="range-pill" transition={spring} className="absolute inset-0 rounded-md bg-zinc-100 dark:bg-zinc-800" />
          )}
          <span className="relative">{label}</span>
        </button>
      ))}
    </div>
  );

  return (
    <section className="mx-auto max-w-6xl space-y-8">
      <header>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Tổng quan tiến độ của bạn</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tighter md:text-4xl">Báo cáo</h1>
      </header>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-6">
        <Reveal index={0} className={`${tile} col-span-2 md:col-span-3 md:row-span-2`}>
          <CompletionRing rate={summary.completionRate} done={summary.byStatus.done} total={summary.total} />
        </Reveal>
        <Reveal index={1} className={`${tile} col-span-1`}>
          <StatTile label="Tổng" value={summary.total} icon={StackIcon} tone="bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300" />
        </Reveal>
        <Reveal index={2} className={`${tile} col-span-1`}>
          <StatTile
            label="Đang làm"
            value={summary.byStatus.in_progress}
            icon={HourglassMediumIcon}
            tone="bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"
          />
        </Reveal>
        <Reveal index={3} className={`${tile} col-span-2 md:col-span-1`}>
          <StatTile
            label="Đã xong"
            value={summary.byStatus.done}
            icon={CheckCircleIcon}
            tone="bg-brand-600 text-white dark:bg-brand-500 dark:text-brand-950"
          />
        </Reveal>
        <Reveal index={4} className={`${tile} col-span-2 md:col-span-3`}>
          <div className="flex h-full items-center gap-5 p-5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-brand-300 dark:bg-zinc-100 dark:text-brand-700">
              <SunHorizonIcon weight="duotone" className="size-[18px]" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Hôm nay</p>
              <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                <span className="font-mono tabular-nums text-zinc-900 dark:text-zinc-100">{today?.dueToday ?? 0}</span> việc đến hạn
                <span className="mx-2 text-zinc-300 dark:text-zinc-700">/</span>
                <span className={`font-mono tabular-nums ${today?.overdue ? 'text-rose-600 dark:text-rose-400' : 'text-zinc-900 dark:text-zinc-100'}`}>
                  {today?.overdue ?? 0}
                </span>{' '}
                việc đang trễ
              </p>
            </div>
          </div>
        </Reveal>

        <Reveal index={5} className={`${tile} col-span-2 md:col-span-4`}>
          <Panel title="Việc hoàn thành theo thời gian" icon={CalendarCheckIcon} action={rangeToggle}>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={buckets} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="rgb(161 161 170 / 0.18)" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: '#a1a1aa', fontSize: 11 }} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: '#a1a1aa', fontSize: 11 }} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="count" name="Việc hoàn thành" fill={STATUS_HEX.done} radius={[6, 6, 2, 2]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>
        </Reveal>
        <Reveal index={6} className={`${tile} col-span-2`}>
          <Panel title="Phân bổ trạng thái">
            {pieData.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Chưa có dữ liệu</p>
            ) : (
              <div className="flex h-full flex-col justify-between gap-4">
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={44} outerRadius={68} paddingAngle={3} strokeWidth={0}>
                      {pieData.map((d) => (
                        <Cell key={d.status} fill={STATUS_HEX[d.status]} />
                      ))}
                    </Pie>
                    <Tooltip {...tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                  {pieData.map((d) => (
                    <li key={d.status} className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                      <span className={`size-2 rounded-full ${STATUS_DOT[d.status]}`} aria-hidden="true" />
                      {d.name}
                      <span className="ml-auto font-mono tabular-nums text-zinc-900 dark:text-zinc-100">{d.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Panel>
        </Reveal>

        <Reveal index={7} className={`${tile} col-span-2 md:col-span-3`}>
          <Panel title={`Trễ hạn (${overdue.length})`} icon={WarningCircleIcon}>
            <TaskLinkList
              tasks={overdue}
              now={now}
              empty="Không có việc trễ hạn"
              tone="text-rose-600 dark:text-rose-400"
              onOpen={openTask}
            />
          </Panel>
        </Reveal>
        <Reveal index={8} className={`${tile} col-span-2 md:col-span-3`}>
          <Panel title={`Sắp đến hạn (${soon.length})`} icon={HourglassMediumIcon}>
            <TaskLinkList
              tasks={soon}
              now={now}
              empty="Không có việc sắp đến hạn"
              tone="text-amber-600 dark:text-amber-400"
              onOpen={openTask}
            />
          </Panel>
        </Reveal>
      </div>
    </section>
  );
}
