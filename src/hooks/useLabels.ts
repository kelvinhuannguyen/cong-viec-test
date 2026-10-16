import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { LabelPatch, NewLabel } from '../domain/task';
import { labelKeys, taskKeys } from './queryKeys';
import { useRepositories } from './RepositoryContext';

export function useLabels() {
  const { labels } = useRepositories();
  return useQuery({ queryKey: labelKeys.all, queryFn: () => labels.list() });
}

export function useCreateLabel() {
  const { labels } = useRepositories();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NewLabel) => labels.create(input),
    onSettled: () => queryClient.invalidateQueries({ queryKey: labelKeys.all }),
  });
}

export function useUpdateLabel() {
  const { labels } = useRepositories();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: LabelPatch }) => labels.update(id, patch),
    onSettled: () => queryClient.invalidateQueries({ queryKey: labelKeys.all }),
  });
}

export function useDeleteLabel() {
  const { labels } = useRepositories();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => labels.remove(id),
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: labelKeys.all }),
        queryClient.invalidateQueries({ queryKey: taskKeys.all }),
      ]),
  });
}
