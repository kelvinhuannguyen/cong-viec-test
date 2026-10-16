import { useCallback } from 'react';
import { useSearchParams } from 'react-router';

export const NEW_TASK = 'new';

export function useTaskDialogParam() {
  const [params, setParams] = useSearchParams();
  const dialogTaskId = params.get('task');

  const setTask = useCallback(
    (value: string | null) =>
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value) next.set('task', value);
          else next.delete('task');
          return next;
        },
        { replace: true },
      ),
    [setParams],
  );

  const openNew = useCallback(() => setTask(NEW_TASK), [setTask]);
  const openTask = useCallback((id: string) => setTask(id), [setTask]);
  const close = useCallback(() => setTask(null), [setTask]);

  return { dialogTaskId, openNew, openTask, close };
}
