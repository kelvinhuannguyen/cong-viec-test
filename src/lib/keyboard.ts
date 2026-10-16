import { useEffect } from 'react';

export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

/** Phím N mở hộp thoại thêm việc, trừ khi đang gõ hoặc đang mở hộp thoại khác. */
export function useNewTaskShortcut(onTrigger: () => void): void {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== 'n' || e.ctrlKey || e.metaKey || e.altKey) return;
      if (isTypingTarget(e.target) || document.querySelector('[role="dialog"]')) return;
      e.preventDefault();
      onTrigger();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onTrigger]);
}
