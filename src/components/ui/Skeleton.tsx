export function Skeleton({ className = '', width }: { className?: string; width?: string }) {
  return (
    <span
      aria-hidden="true"
      style={width ? { width } : undefined}
      className={`block animate-shimmer rounded-md bg-[linear-gradient(90deg,var(--color-zinc-100)_0%,var(--color-zinc-200)_50%,var(--color-zinc-100)_100%)] bg-[length:200%_100%] dark:bg-[linear-gradient(90deg,var(--color-zinc-900)_0%,var(--color-zinc-800)_50%,var(--color-zinc-900)_100%)] ${className}`}
    />
  );
}

/** Khung xương có cùng kích thước với danh sách việc thật. */
export function TaskListSkeleton() {
  return (
    <div
      role="status"
      aria-label="Đang tải công việc"
      className="divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-200/70 bg-white dark:divide-zinc-800/70 dark:border-zinc-800/70 dark:bg-zinc-900/40"
    >
      {['62%', '41%', '55%', '33%'].map((width) => (
        <div key={width} className="flex items-center gap-3 px-4 py-3.5">
          <Skeleton className="size-5" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5" width={width} />
            <Skeleton className="h-2.5 w-24" />
          </div>
          <Skeleton className="h-7 w-24 rounded-full" />
        </div>
      ))}
    </div>
  );
}
