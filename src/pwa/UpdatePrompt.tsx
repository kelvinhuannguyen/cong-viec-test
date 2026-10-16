import { useRegisterSW } from 'virtual:pwa-register/react';

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
    <div
      role="status"
      className="fixed inset-x-4 top-4 z-50 mx-auto flex max-w-md items-center gap-3 rounded-xl bg-slate-900 p-3 text-sm text-white shadow-lg"
    >
      <span className="flex-1">Có phiên bản mới.</span>
      <button type="button" className="font-semibold text-blue-300 hover:underline" onClick={() => void updateServiceWorker(true)}>
        Tải lại
      </button>
      <button type="button" className="text-slate-300 hover:underline" onClick={() => setNeedRefresh(false)}>
        Để sau
      </button>
    </div>
  );
}
