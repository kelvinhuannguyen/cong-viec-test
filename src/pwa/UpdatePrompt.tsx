import { SparkleIcon } from '@phosphor-icons/react';
import { motion } from 'motion/react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { spring } from '../components/ui/styles';

export const SW_UPDATE_INTERVAL_MS = 60 * 60 * 1000;

/**
 * Ứng dụng đã cài có thể mở nhiều ngày liền mà không tải lại trang, nên trình duyệt ít khi tự kiểm tra
 * bản mới: hỏi máy chủ định kỳ. Bỏ qua khi mất mạng hoặc đang cài dở một bản.
 */
export function scheduleUpdateChecks(registration: ServiceWorkerRegistration, intervalMs = SW_UPDATE_INTERVAL_MS) {
  return setInterval(() => {
    if (!navigator.onLine || registration.installing) return;
    registration.update().catch(() => undefined);
  }, intervalMs);
}

export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW: (_swUrl, registration) => {
      if (registration) scheduleUpdateChecks(registration);
    },
  });

  if (!needRefresh) return null;

  return (
    <motion.div
      role="status"
      initial={{ opacity: 0, y: -16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={spring}
      className="fixed inset-x-4 top-4 z-50 mx-auto flex max-w-sm items-center gap-3 rounded-2xl bg-zinc-900 py-2.5 pl-4 pr-2.5 text-sm text-zinc-100 shadow-[0_16px_40px_-12px_rgb(9_9_11/0.45),inset_0_1px_0_rgb(255_255_255/0.08)] dark:bg-zinc-800"
    >
      <SparkleIcon weight="fill" className="size-4 shrink-0 text-brand-400" aria-hidden="true" />
      <span className="flex-1">Có phiên bản mới.</span>
      <button
        type="button"
        className="rounded-lg px-2.5 py-1 font-medium text-brand-300 transition-colors hover:bg-white/10 active:scale-[0.97]"
        onClick={() => void updateServiceWorker(true)}
      >
        Tải lại
      </button>
      <button
        type="button"
        className="rounded-lg px-2.5 py-1 text-zinc-400 transition-colors hover:bg-white/10 hover:text-zinc-200 active:scale-[0.97]"
        onClick={() => setNeedRefresh(false)}
      >
        Để sau
      </button>
    </motion.div>
  );
}
