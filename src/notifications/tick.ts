import { format } from 'date-fns';
import { dailySummary, dueReminders, pruneSentKeys } from '../domain/reminders';
import type { Task } from '../domain/task';
import { PREF_KEYS, readPref, writePref } from '../lib/prefs';
import type { AppNotification } from './notifier';

export interface ReminderStore {
  getSent(): string[];
  setSent(keys: string[]): void;
  getLastSummaryDate(): string | null;
  setLastSummaryDate(date: string): void;
}

export const localReminderStore: ReminderStore = {
  getSent: () => readPref<string[]>(PREF_KEYS.remindersSent, []),
  setSent: (keys) => writePref(PREF_KEYS.remindersSent, keys),
  getLastSummaryDate: () => readPref<string | null>(PREF_KEYS.lastSummaryDate, null),
  setLastSummaryDate: (date) => writePref(PREF_KEYS.lastSummaryDate, date),
};

export function runReminderTick(
  tasks: Task[],
  now: Date,
  store: ReminderStore,
  // Trả về true khi thông báo thực sự đã hiện; false thì lần kiểm tra sau sẽ thử lại.
  notify: (notification: AppNotification) => boolean,
  options: { prune: boolean },
): void {
  const today = format(now, 'yyyy-MM-dd');
  if (store.getLastSummaryDate() !== today) {
    const summary = dailySummary(tasks, now);
    const delivered =
      !summary ||
      notify({
        title: 'Công Việc Của Tôi',
        body: `Hôm nay có ${summary.dueToday} việc đến hạn, ${summary.overdue} việc đang trễ`,
      });
    if (delivered) store.setLastSummaryDate(today);
  }

  let sent = store.getSent();
  if (options.prune) sent = pruneSentKeys(sent, tasks);
  const sentSet = new Set(sent);
  const reminders = dueReminders(tasks, now, sentSet);
  let added = false;
  for (const reminder of reminders) {
    const delivered = notify({
      title: reminder.kind === 'due_soon' ? 'Sắp đến hạn' : 'Đã trễ hạn',
      body: reminder.task.title,
      taskId: reminder.task.id,
    });
    if (delivered) {
      sentSet.add(reminder.key);
      added = true;
    }
  }
  if (options.prune || added) store.setSent([...sentSet]);
}
