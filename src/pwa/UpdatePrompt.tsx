import { useRegisterSW } from 'virtual:pwa-register/react';

export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

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
