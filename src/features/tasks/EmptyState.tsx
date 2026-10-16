import { FunnelSimpleXIcon, PlusIcon } from '@phosphor-icons/react';
import { btn } from '../../components/ui/styles';

/** Hình minh hoạ: chồng thẻ việc vẽ bằng SVG, có một dấu tích nổi. */
function StackIllustration() {
  return (
    <svg viewBox="0 0 160 112" className="h-28 w-40" aria-hidden="true">
      <rect x="28" y="22" width="104" height="22" rx="7" className="fill-zinc-100 dark:fill-zinc-800/70" />
      <rect x="20" y="44" width="120" height="26" rx="8" className="fill-zinc-200/70 dark:fill-zinc-800" />
      <rect
        x="12"
        y="68"
        width="136"
        height="32"
        rx="9"
        className="fill-white stroke-zinc-200 dark:fill-zinc-900 dark:stroke-zinc-700"
        strokeWidth="1"
      />
      <rect x="24" y="78" width="12" height="12" rx="3.5" className="fill-brand-500" />
      <path d="M27 84.2l2.1 2.1 4.1-4.4" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="44" y="80" width="58" height="4" rx="2" className="fill-zinc-300 dark:fill-zinc-600" />
      <rect x="44" y="88" width="34" height="3" rx="1.5" className="fill-zinc-200 dark:fill-zinc-700" />
      <circle cx="136" cy="22" r="10" className="animate-breathe fill-brand-100 dark:fill-brand-900/60" />
      <circle cx="136" cy="22" r="4" className="fill-brand-500" />
    </svg>
  );
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  variant = 'empty',
}: {
  title: string;
  description?: string;
  actionLabel: string;
  onAction: () => void;
  variant?: 'empty' | 'filtered';
}) {
  return (
    <div className="flex flex-col items-start gap-5 rounded-3xl border border-dashed border-zinc-300 bg-white/50 p-8 sm:flex-row sm:items-center sm:gap-8 sm:p-10 dark:border-zinc-700 dark:bg-zinc-900/30">
      {variant === 'empty' ? (
        <StackIllustration />
      ) : (
        <span className="flex size-14 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800">
          <FunnelSimpleXIcon className="size-6 text-zinc-500" aria-hidden="true" />
        </span>
      )}
      <div className="max-w-[46ch]">
        <p className="text-base font-semibold tracking-tight">{title}</p>
        {description && <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">{description}</p>}
        <button type="button" className={`${variant === 'empty' ? btn.primary : btn.secondary} mt-4`} onClick={onAction}>
          {variant === 'empty' && <PlusIcon weight="bold" className="size-4" aria-hidden="true" />}
          {actionLabel}
        </button>
      </div>
    </div>
  );
}
