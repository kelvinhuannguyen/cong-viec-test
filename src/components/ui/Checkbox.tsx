import { CheckIcon } from '@phosphor-icons/react';
import { motion } from 'motion/react';
import { spring } from './styles';

/** Ô tích tròn góc: giữ <input type="checkbox"> thật (trong suốt) để bàn phím và trình đọc màn hình dùng được. */
export function Checkbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <span className="relative inline-flex size-5 shrink-0">
      <input
        type="checkbox"
        aria-label={label}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="peer absolute inset-0 m-0 size-5 cursor-pointer opacity-0"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none flex size-5 items-center justify-center rounded-md border-[1.5px] border-zinc-300 bg-white transition-colors duration-200 peer-hover:border-zinc-400 peer-focus-visible:ring-4 peer-focus-visible:ring-brand-500/25 peer-checked:border-brand-600 peer-checked:bg-brand-600 dark:border-zinc-600 dark:bg-zinc-900 dark:peer-hover:border-zinc-500 dark:peer-checked:border-brand-500 dark:peer-checked:bg-brand-500"
      >
        <motion.span
          initial={false}
          animate={{ scale: checked ? 1 : 0.4, opacity: checked ? 1 : 0 }}
          transition={spring}
          className="flex"
        >
          <CheckIcon weight="bold" className="size-3.5 text-white dark:text-brand-950" />
        </motion.span>
      </span>
    </span>
  );
}
