import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter, useLocation } from 'react-router';
import { AppProviders } from '../app/AppProviders';
import { AppRoutes } from '../app/AppRoutes';
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

export function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname + location.search}</div>;
}

export function renderApp(repositories: Repositories, route = '/') {
  return render(
    <AppProviders repositories={repositories} queryClient={createQueryClient()}>
      <MemoryRouter initialEntries={[route]}>
        <AppRoutes />
        <LocationProbe />
      </MemoryRouter>
    </AppProviders>,
  );
}
