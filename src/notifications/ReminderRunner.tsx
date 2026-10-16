import { useEffect, useRef } from 'react';
import { useTaskDialogParam } from '../features/tasks/useTaskDialogParam';
import { useTasks } from '../hooks/useTasks';
import { showNotification } from './notifier';
import { localReminderStore, runReminderTick } from './tick';
import { useReminderSettings } from './useReminderSettings';

const CHECK_INTERVAL_MS = 60_000;

export function ReminderRunner() {
  const { active } = useReminderSettings();
  const { data: tasks } = useTasks();
  const { openTask } = useTaskDialogParam();
  const openRef = useRef(openTask);
  const prunedRef = useRef(false);

  useEffect(() => {
    openRef.current = openTask;
  });

  useEffect(() => {
    if (!active || !tasks) return;
    const run = () => {
      runReminderTick(
        tasks,
        new Date(),
        localReminderStore,
        (n) => showNotification(n, (id) => openRef.current(id)),
        { prune: !prunedRef.current },
      );
      prunedRef.current = true;
    };
    run();
    const id = window.setInterval(run, CHECK_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [active, tasks]);

  return null;
}
