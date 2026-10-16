import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../components/ui/Toast';
import { applyStatusChange } from '../domain/rules';
import type { NewTask, Task, TaskPatch, TaskUpdate } from '../domain/task';
import { SAVE_ERROR } from '../lib/errors';
import { stripUndefined } from '../lib/object';
import { taskKeys } from './queryKeys';
import { useRepositories } from './RepositoryContext';

export const UNDO_DURATION_MS = 5000;

export function useTasks() {
  const { tasks } = useRepositories();
  return useQuery({ queryKey: taskKeys.all, queryFn: () => tasks.list() });
}

export function useCreateTask() {
  const { tasks } = useRepositories();
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (input: NewTask) => tasks.create(input),
    onError: () => toast.show({ message: SAVE_ERROR }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: taskKeys.all }),
  });
}

function optimisticUpdate(task: Task, patch: TaskPatch, now: Date): Task {
  const next: Task = { ...task, ...stripUndefined(patch) };
  return patch.status ? { ...next, ...applyStatusChange(task, patch.status, now) } : next;
}

export function useUpdateTasks() {
  const { tasks } = useRepositories();
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation<Task[], Error, TaskUpdate[], { previous?: Task[] }>({
    mutationFn: (updates) => Promise.all(updates.map((u) => tasks.update(u.id, u.patch))),
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.all });
      const previous = queryClient.getQueryData<Task[]>(taskKeys.all);
      const now = new Date();
      queryClient.setQueryData<Task[]>(taskKeys.all, (old) =>
        old?.map((t) => {
          const update = updates.find((u) => u.id === t.id);
          return update ? optimisticUpdate(t, update.patch, now) : t;
        }),
      );
      return { previous };
    },
    onError: (_error, _updates, context) => {
      if (context?.previous) queryClient.setQueryData(taskKeys.all, context.previous);
      toast.show({ message: SAVE_ERROR });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: taskKeys.all }),
  });
}

export function useDeleteTask() {
  const { tasks } = useRepositories();
  const queryClient = useQueryClient();
  const toast = useToast();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: taskKeys.all });

  const restore = useMutation({
    mutationFn: (task: Task) => tasks.restore(task),
    onError: () => toast.show({ message: SAVE_ERROR }),
    onSettled: invalidate,
  });

  return useMutation<void, Error, Task, { previous?: Task[] }>({
    mutationFn: (task) => tasks.remove(task.id),
    onMutate: async (task) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.all });
      const previous = queryClient.getQueryData<Task[]>(taskKeys.all);
      queryClient.setQueryData<Task[]>(taskKeys.all, (old) => old?.filter((t) => t.id !== task.id));
      return { previous };
    },
    onError: (_error, _task, context) => {
      if (context?.previous) queryClient.setQueryData(taskKeys.all, context.previous);
      toast.show({ message: SAVE_ERROR });
    },
    onSuccess: (_data, task) => {
      toast.show({
        message: `Đã xoá "${task.title}"`,
        actionLabel: 'Hoàn tác',
        onAction: () => restore.mutate(task),
        durationMs: UNDO_DURATION_MS,
      });
    },
    onSettled: invalidate,
  });
}
