import { WifiSlashIcon } from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'motion/react';
import { useSyncExternalStore } from 'react';
import { spring } from '../components/ui/styles';

function subscribe(callback: () => void) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

export function useOnline(): boolean {
  return useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
}

/** Dải báo mất mạng (chỉ dùng khi dữ liệu nằm trên Supabase). */
export function OfflineBanner() {
  const online = useOnline();
  return (
    <AnimatePresence>
      {!online && (
        <motion.p
          role="status"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={spring}
          className="mb-6 flex items-center gap-2.5 rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
        >
          <WifiSlashIcon className="size-4 shrink-0 text-amber-500" aria-hidden="true" />
          Đang ngoại tuyến. Thay đổi sẽ được gửi khi có mạng trở lại.
        </motion.p>
      )}
    </AnimatePresence>
  );
}
