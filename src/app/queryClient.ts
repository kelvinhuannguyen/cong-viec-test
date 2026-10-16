import { QueryClient } from '@tanstack/react-query';

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      // Dữ liệu nằm trong máy: không chờ mạng, không thử lại; đọc IndexedDB rẻ nên tải lại khi quay lại tab để các tab đồng bộ.
      queries: { networkMode: 'always', staleTime: Infinity, retry: false, refetchOnWindowFocus: true },
      mutations: { networkMode: 'always', retry: false },
    },
  });
}
