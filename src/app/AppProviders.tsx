import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { useEffect, useState, type ReactNode } from 'react';
import { ToastProvider } from '../components/ui/Toast';
import type { Repositories } from '../data/repository';
import { RepositoryProvider } from '../hooks/RepositoryContext';
import { connectCrossTabSync } from './crossTabSync';
import { createQueryClient } from './queryClient';

export function AppProviders({
  repositories,
  queryClient,
  syncTabs = false,
  children,
}: {
  repositories: Repositories;
  queryClient?: QueryClient;
  /** Đồng bộ với các tab khác qua BroadcastChannel (tắt trong kiểm thử để các bài không ảnh hưởng nhau). */
  syncTabs?: boolean;
  children: ReactNode;
}) {
  const [client] = useState(() => queryClient ?? createQueryClient());

  useEffect(() => (syncTabs ? connectCrossTabSync(client) : undefined), [client, syncTabs]);

  return (
    <QueryClientProvider client={client}>
      <RepositoryProvider repositories={repositories}>
        <ToastProvider>{children}</ToastProvider>
      </RepositoryProvider>
    </QueryClientProvider>
  );
}
