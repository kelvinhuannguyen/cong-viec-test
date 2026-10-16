import { QueryClient } from '@tanstack/react-query';
import type { Backend } from '../data';

export function createQueryClient(backend: Backend = 'local'): QueryClient {
  if (backend === 'supabase') {
    return new QueryClient({
      defaultOptions: {
        // Dữ liệu trên máy chủ: tạm dừng khi mất mạng (chạy tiếp khi có mạng), đọc lại khi quay lại tab
        // để thấy thay đổi từ thiết bị khác, thử lại truy vấn đọc vài lần khi mạng chập chờn.
        queries: { networkMode: 'online', staleTime: 30_000, retry: 2, refetchOnWindowFocus: true },
        mutations: { networkMode: 'online', retry: false },
      },
    });
  }
  return new QueryClient({
    defaultOptions: {
      // Dữ liệu nằm trong máy: không chờ mạng, không thử lại. Chỉ đọc lại khi có thay đổi
      // (sau mỗi thao tác ghi, hoặc khi tab khác báo qua connectCrossTabSync), nên staleTime: Infinity.
      queries: { networkMode: 'always', staleTime: Infinity, retry: false, refetchOnWindowFocus: false },
      mutations: { networkMode: 'always', retry: false },
    },
  });
}
