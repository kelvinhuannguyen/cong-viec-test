import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { AppProviders } from '../app/AppProviders';
import { createQueryClient } from '../app/queryClient';
import { createDexieRepositories } from '../data/dexie/createDexieRepositories';
import { AppDatabase } from '../data/dexie/db';
import type { Repositories } from '../data/repository';

export function createTestRepositories(now?: () => Date): Repositories {
  return createDexieRepositories(new AppDatabase(`test-${crypto.randomUUID()}`), now);
}

export function createWrapper(repositories: Repositories) {
  const queryClient = createQueryClient();
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <AppProviders repositories={repositories} queryClient={queryClient}>
        <MemoryRouter>{children}</MemoryRouter>
      </AppProviders>
    );
  };
}
