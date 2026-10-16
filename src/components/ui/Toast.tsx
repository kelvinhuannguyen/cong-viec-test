import { AnimatePresence, motion } from 'motion/react';
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { spring } from './styles';

export interface ToastOptions {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  durationMs?: number;
}

interface ToastItem extends ToastOptions {
  id: number;
}

interface ToastApi {
  show(options: ToastOptions): void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setItems((list) => list.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (options: ToastOptions) => {
      const id = nextId.current++;
      setItems((list) => [...list, { ...options, id }]);
      window.setTimeout(() => dismiss(id), options.durationMs ?? 4000);
    },
    [dismiss],
  );

  const api = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex flex-col items-center gap-2 px-4 md:bottom-8"
      >
        <AnimatePresence initial={false}>
          {items.map((t) => (
            <motion.div
              key={t.id}
              role="status"
              layout
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={spring}
              className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl bg-zinc-900 py-2.5 pl-4 pr-2.5 text-sm text-zinc-100 shadow-[0_16px_40px_-12px_rgb(9_9_11/0.45),inset_0_1px_0_rgb(255_255_255/0.08)] dark:bg-zinc-800"
            >
              <span className="flex-1">{t.message}</span>
              {t.actionLabel && (
                <button
                  type="button"
                  className="rounded-lg px-2.5 py-1 font-medium text-brand-300 transition-colors hover:bg-white/10 active:scale-[0.97]"
                  onClick={() => {
                    t.onAction?.();
                    dismiss(t.id);
                  }}
                >
                  {t.actionLabel}
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast phải nằm trong ToastProvider');
  return ctx;
}
