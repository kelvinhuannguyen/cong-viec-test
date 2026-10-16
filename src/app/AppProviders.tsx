import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { ToastProvider } from '../components/ui/Toast';
import type { Repositories } from '../data/repository';
import { RepositoryProvider } from '../hooks/RepositoryContext';
import { createQueryClient } from './queryClient';

export function AppProviders({
  repositories,
  queryClient,
  children,
}: {
  repositories: Repositories;
  queryClient?: QueryClient;
  children: ReactNode;
}) {
  const [client] = useState(() => queryClient ?? createQueryClient());
  return (
    <QueryClientProvider client={client}>
      <RepositoryProvider repositories={repositories}>
        <ToastProvider>{children}</ToastProvider>
      </RepositoryProvider>
    </QueryClientProvider>
  );
}
