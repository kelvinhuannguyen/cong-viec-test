import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Label, Task } from '../domain/task';
import { labelKeys, taskKeys } from './queryKeys';
import { useRepositories } from './RepositoryContext';

export function useImportData() {
  const repositories = useRepositories();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { tasks: Task[]; labels: Label[] }) => repositories.importData(data),
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: taskKeys.all }),
        queryClient.invalidateQueries({ queryKey: labelKeys.all }),
      ]),
  });
}
