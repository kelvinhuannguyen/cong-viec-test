import { ArrowRightIcon, WarningCircleIcon } from '@phosphor-icons/react';
import { motion } from 'motion/react';
import { Link } from 'react-router';
import { spring } from '../components/ui/styles';
import { isOverdue } from '../domain/rules';
import type { Task } from '../domain/task';
import { useReminderSettings } from './useReminderSettings';

export function ReminderBanner({ tasks, now }: { tasks: Task[]; now: Date }) {
  const { active, permission } = useReminderSettings();
  const overdue = tasks.filter((t) => isOverdue(t, now)).length;
  if (active || overdue === 0) return null;

  const hint =
    permission === 'denied' ? (
      'Trình duyệt đang chặn thông báo của trang này.'
    ) : permission === 'unsupported' ? (
      'Trình duyệt này không hỗ trợ thông báo.'
    ) : (
      <>
        <Link
          to="/cai-dat"
          className="inline-flex items-center gap-1 font-medium text-rose-700 underline-offset-4 hover:underline dark:text-rose-300"
        >
          Bật nhắc hạn chót
          <ArrowRightIcon className="size-3.5" aria-hidden="true" />
        </Link>{' '}
        để nhận thông báo.
      </>
    );

  return (
    <motion.div
      role="alert"
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring}
      className="flex items-start gap-3 rounded-2xl border border-rose-200/70 bg-rose-50/70 px-4 py-3 text-sm dark:border-rose-500/15 dark:bg-rose-500/[0.06]"
    >
      <span className="relative mt-0.5 flex size-4 shrink-0 items-center justify-center">
        <span className="absolute size-4 animate-breathe rounded-full bg-rose-400/30" aria-hidden="true" />
        <WarningCircleIcon weight="fill" className="relative size-4 text-rose-500" aria-hidden="true" />
      </span>
      <p className="text-zinc-700 dark:text-zinc-300">
        <span className="font-medium text-rose-700 dark:text-rose-300">Bạn có {overdue} việc trễ hạn.</span>{' '}
        <span className="text-zinc-500 dark:text-zinc-400">{hint}</span>
      </p>
    </motion.div>
  );
}
