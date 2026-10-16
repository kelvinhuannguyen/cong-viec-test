import { QueryClient } from '@tanstack/react-query';

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      // Dữ liệu nằm trong máy: không chờ mạng, không tự tải lại, không thử lại.
      queries: { networkMode: 'always', staleTime: Infinity, retry: false, refetchOnWindowFocus: false },
      mutations: { networkMode: 'always', retry: false },
    },
  });
}
