import { BrowserRouter } from 'react-router';
import { AppProviders } from './app/AppProviders';
import { AppRoutes } from './app/AppRoutes';
import { ErrorBoundary } from './app/ErrorBoundary';
import { StorageGate } from './app/StorageGate';

export function App() {
  return (
    <ErrorBoundary>
      <StorageGate>
        {(repositories) => (
          <AppProviders repositories={repositories} syncTabs>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </AppProviders>
        )}
      </StorageGate>
    </ErrorBoundary>
  );
}
