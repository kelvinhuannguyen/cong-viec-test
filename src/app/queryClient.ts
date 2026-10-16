import { QueryClient } from '@tanstack/react-query';

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      // Dữ liệu nằm trong máy: không chờ mạng, không thử lại. Chỉ đọc lại khi có thay đổi
      // (sau mỗi thao tác ghi, hoặc khi tab khác báo qua connectCrossTabSync), nên staleTime: Infinity.
      queries: { networkMode: 'always', staleTime: Infinity, retry: false, refetchOnWindowFocus: false },
      mutations: { networkMode: 'always', retry: false },
    },
  });
}
