import { useCallback } from 'react';
import { useSearchParams } from 'react-router';
import { parseSortKey, parseStatusFilter, type SortKey, type StatusFilter } from '../../domain/query';

interface UrlChanges {
  status?: StatusFilter;
  q?: string;
  sort?: SortKey;
}

export function useTaskUrlState() {
  const [params, setParams] = useSearchParams();
  const status = parseStatusFilter(params.get('status'));
  const q = params.get('q') ?? '';
  const sort = parseSortKey(params.get('sort'));

  const update = useCallback(
    (changes: UrlChanges) =>
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (changes.status !== undefined) {
            if (changes.status === 'all') next.delete('status');
            else next.set('status', changes.status);
          }
          if (changes.q !== undefined) {
            if (changes.q.trim() === '') next.delete('q');
            else next.set('q', changes.q);
          }
          if (changes.sort !== undefined) {
            if (changes.sort === 'due') next.delete('sort');
            else next.set('sort', changes.sort);
          }
          return next;
        },
        { replace: true },
      ),
    [setParams],
  );

  return {
    status,
    q,
    sort,
    setStatus: (value: StatusFilter) => update({ status: value }),
    setQuery: (value: string) => update({ q: value }),
    setSort: (value: SortKey) => update({ sort: value }),
    clearFilters: () => update({ status: 'all', q: '' }),
  };
}
