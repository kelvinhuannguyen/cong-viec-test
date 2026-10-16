import { btn } from '../../components/ui/styles';

export function EmptyState({ title, actionLabel, onAction }: { title: string; actionLabel: string; onAction: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center dark:border-slate-700">
      <p className="mb-4 text-slate-500">{title}</p>
      <button type="button" className={btn.primary} onClick={onAction}>
        {actionLabel}
      </button>
    </div>
  );
}
