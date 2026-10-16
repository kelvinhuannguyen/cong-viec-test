import { useState } from 'react';
import { BrowserRouter } from 'react-router';
import { AppProviders } from './app/AppProviders';
import { AppRoutes } from './app/AppRoutes';
import { ErrorBoundary } from './app/ErrorBoundary';
import { createQueryClient } from './app/queryClient';
import { StorageGate } from './app/StorageGate';
import { getBackend } from './data';
import { createSupabaseBackend, type SupabaseBackend } from './data/supabase';
import { AuthGate } from './features/auth/AuthGate';
import { LocalImportPrompt } from './features/auth/LocalImportPrompt';
import { SessionProvider, type Session } from './features/auth/SessionContext';

/** Chế độ lưu trên máy (không cấu hình Supabase): như v1, không cần đăng nhập. */
function LocalApp() {
  return (
    <StorageGate>
      {(repositories) => (
        <AppProviders repositories={repositories} syncTabs>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AppProviders>
      )}
    </StorageGate>
  );
}

/** Một phiên đăng nhập: repository và bộ nhớ đệm riêng, bỏ hết khi đăng xuất / đổi tài khoản. */
function SignedInApp({ session, cloud }: { session: Session; cloud: SupabaseBackend }) {
  const [repositories] = useState(() => cloud.createRepositories());
  const [queryClient] = useState(() => createQueryClient('supabase'));
  return (
    <SessionProvider value={session}>
      <AppProviders repositories={repositories} queryClient={queryClient} syncTabs>
        <BrowserRouter>
          <AppRoutes />
          <LocalImportPrompt userId={session.user.id} />
        </BrowserRouter>
      </AppProviders>
    </SessionProvider>
  );
}

function CloudApp() {
  const [cloud] = useState(() =>
    createSupabaseBackend(import.meta.env.VITE_SUPABASE_URL ?? '', import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? ''),
  );
  return (
    <AuthGate auth={cloud.auth}>
      {(session) => <SignedInApp key={session.user.id} session={session} cloud={cloud} />}
    </AuthGate>
  );
}

export function App() {
  return <ErrorBoundary>{getBackend() === 'supabase' ? <CloudApp /> : <LocalApp />}</ErrorBoundary>;
}
