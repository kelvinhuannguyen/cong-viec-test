import { Link } from 'react-router';
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
        Bật{' '}
        <Link to="/cai-dat" className="font-semibold underline">
          Nhắc hạn chót
        </Link>{' '}
        để nhận thông báo.
      </>
    );

  return (
    <div
      role="alert"
      className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
    >
      Bạn có {overdue} việc trễ hạn. {hint}
    </div>
  );
}
