import { XIcon } from '@phosphor-icons/react';
import { motion } from 'motion/react';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { btn, spring } from './styles';

export function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    panelRef.current?.querySelector<HTMLElement>('input, textarea, select')?.focus();
  }, []);

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-40 flex items-end justify-center bg-zinc-950/40 backdrop-blur-[2px] md:items-center md:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={spring}
        className="max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl border border-zinc-200/70 bg-white p-6 shadow-[0_24px_64px_-16px_rgb(9_9_11/0.25)] md:max-w-xl md:rounded-3xl dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-[0_24px_64px_-16px_rgb(0_0_0/0.6),inset_0_1px_0_rgb(255_255_255/0.04)]"
      >
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 id={titleId} className="text-lg font-semibold tracking-tight">
            {title}
          </h2>
          <button type="button" className={btn.icon} aria-label="Đóng" onClick={onClose}>
            <XIcon className="size-4" aria-hidden="true" />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>,
    document.body,
  );
}
