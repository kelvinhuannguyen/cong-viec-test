const base =
  'inline-flex items-center justify-center gap-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-[background-color,color,border-color,transform] duration-200 ease-(--ease-spring) active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50';

export const btn = {
  primary: `${base} h-9 px-3.5 bg-brand-600 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.18),0_1px_2px_rgb(9_9_11/0.12)] hover:bg-brand-700 dark:bg-brand-500 dark:text-brand-950 dark:hover:bg-brand-400`,
  secondary: `${base} h-9 px-3.5 border border-zinc-200 bg-white text-zinc-800 shadow-[0_1px_2px_rgb(9_9_11/0.04)] hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/80`,
  ghost: `${base} h-8 px-2.5 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100`,
  danger: `${base} h-9 px-3 text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10`,
  icon: `${base} size-8 shrink-0 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100`,
};

/** Ô nhập không có độ rộng: nơi gọi tự thêm w-full / w-auto. */
export const field =
  'h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-[0_1px_2px_rgb(9_9_11/0.04)] transition-[border-color,box-shadow] duration-200 placeholder:text-zinc-400 hover:border-zinc-300 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:hover:border-zinc-700';

export const card =
  'rounded-3xl border border-zinc-200/70 bg-white p-6 shadow-[0_1px_2px_rgb(9_9_11/0.03),0_16px_40px_-24px_rgb(9_9_11/0.12)] dark:border-zinc-800/70 dark:bg-zinc-900/50 dark:shadow-none';

export const fieldLabel = 'text-sm font-medium text-zinc-700 dark:text-zinc-300';

export const kbd =
  'inline-flex h-5 min-w-5 items-center justify-center rounded border border-zinc-200 bg-zinc-50 px-1 font-mono text-[11px] text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400';

export const spring = { type: 'spring', stiffness: 380, damping: 32 } as const;
export const softSpring = { type: 'spring', stiffness: 100, damping: 20 } as const;
