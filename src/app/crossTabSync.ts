import type { QueryClient } from '@tanstack/react-query';
import { labelKeys, taskKeys } from '../hooks/queryKeys';

export const SYNC_CHANNEL = 'cong-viec-cua-toi:sync';

/**
 * Báo cho các tab khác (cùng trình duyệt) khi tab này vừa ghi dữ liệu, để chúng đọc lại.
 * Trả về hàm huỷ kết nối. Trình duyệt không có BroadcastChannel thì không làm gì.
 */
export function connectCrossTabSync(queryClient: QueryClient, channelName = SYNC_CHANNEL): () => void {
  if (typeof BroadcastChannel === 'undefined') return () => {};
  const channel = new BroadcastChannel(channelName);

  channel.onmessage = () => {
    void queryClient.invalidateQueries({ queryKey: taskKeys.all });
    void queryClient.invalidateQueries({ queryKey: labelKeys.all });
  };

  // Báo cả khi lỗi: thao tác có thể đã ghi một phần trước khi hỏng.
  const unsubscribe = queryClient.getMutationCache().subscribe((event) => {
    if (event.type !== 'updated') return;
    if (event.action.type === 'success' || event.action.type === 'error') channel.postMessage('changed');
  });

  return () => {
    unsubscribe();
    channel.close();
  };
}
