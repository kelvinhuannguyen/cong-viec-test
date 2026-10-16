import { KeyReturnIcon, PlusIcon } from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'motion/react';
import { useState, type FormEvent } from 'react';
import { kbd, spring } from '../../components/ui/styles';
import { normalizeTitle } from '../../domain/rules';
import { useCreateTask } from '../../hooks/useTasks';

export function QuickAdd() {
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const createTask = useCreateTask();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const normalized = normalizeTitle(title);
    if (!normalized) {
      setError('Tên tối đa 200 ký tự');
      return;
    }
    setError('');
    const submitted = title;
    // Chỉ xoá khi ô vẫn giữ đúng chữ vừa gửi: gõ nhanh việc kế tiếp trong lúc chờ lưu thì không bị mất.
    createTask.mutate({ title: normalized }, { onSuccess: () => setTitle((cur) => (cur === submitted ? '' : cur)) });
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="group relative flex items-center">
        <PlusIcon
          weight="bold"
          className="pointer-events-none absolute left-3.5 size-4 text-zinc-400 transition-colors group-focus-within:text-brand-600 dark:group-focus-within:text-brand-400"
          aria-hidden="true"
        />
        <input
          aria-label="Thêm nhanh công việc"
          placeholder="Thêm nhanh một việc..."
          className="h-10 w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-24 text-sm text-zinc-900 shadow-[0_1px_2px_rgb(9_9_11/0.04)] transition-[border-color,box-shadow] duration-200 placeholder:text-zinc-400 hover:border-zinc-300 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:hover:border-zinc-700"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setError('');
          }}
        />
        <AnimatePresence>
          {title.trim() && (
            <motion.span
              initial={{ opacity: 0, x: 6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 6 }}
              transition={spring}
              className="pointer-events-none absolute right-3 flex items-center gap-1.5 text-xs text-zinc-400"
            >
              <kbd className={kbd}>
                <KeyReturnIcon className="size-3" aria-hidden="true" />
              </kbd>
              để thêm
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      {error && (
        <p role="alert" className="mt-1.5 text-sm text-rose-600 dark:text-rose-400">
          {error}
        </p>
      )}
    </form>
  );
}
