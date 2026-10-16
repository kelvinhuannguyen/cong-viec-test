import { createContext, useContext, type ReactNode } from 'react';
import type { Repositories } from '../data/repository';

const RepositoryContext = createContext<Repositories | null>(null);

export function RepositoryProvider({ repositories, children }: { repositories: Repositories; children: ReactNode }) {
  return <RepositoryContext.Provider value={repositories}>{children}</RepositoryContext.Provider>;
}

export function useRepositories(): Repositories {
  const repositories = useContext(RepositoryContext);
  if (!repositories) throw new Error('useRepositories phải nằm trong RepositoryProvider');
  return repositories;
}
