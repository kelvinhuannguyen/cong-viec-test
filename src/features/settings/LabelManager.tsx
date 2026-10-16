import { CaretDownIcon, PlusIcon, TrashIcon } from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'motion/react';
import { useMemo, useState, type FormEvent } from 'react';
import { useToast } from '../../components/ui/Toast';
import { btn, field, spring } from '../../components/ui/styles';
import { LABEL_COLORS, type Label, type LabelColor } from '../../domain/task';
import { useCreateLabel, useDeleteLabel, useLabels, useUpdateLabel } from '../../hooks/useLabels';
import { useTasks } from '../../hooks/useTasks';
import { errorMessage } from '../../lib/errors';
import { LABEL_COLOR_NAMES, LABEL_DOT_CLASSES } from '../../lib/labelColors';

function ColorSelect({ label, value, onChange }: { label: string; value: LabelColor; onChange: (c: LabelColor) => void }) {
  return (
    <span className="relative inline-flex shrink-0 items-center">
      <span className={`pointer-events-none absolute left-3 size-2.5 rounded-full ${LABEL_DOT_CLASSES[value]}`} aria-hidden="true" />
      <select
        aria-label={label}
        className={`${field} w-auto cursor-pointer appearance-none pl-7 pr-8`}
        value={value}
        onChange={(e) => onChange(e.target.value as LabelColor)}
      >
        {LABEL_COLORS.map((c) => (
          <option key={c} value={c}>
            {LABEL_COLOR_NAMES[c]}
          </option>
        ))}
      </select>
      <CaretDownIcon className="pointer-events-none absolute right-2.5 size-3 text-zinc-400" aria-hidden="true" />
    </span>
  );
}

export function LabelManager() {
  const { data: labels = [] } = useLabels();
  const { data: tasks = [] } = useTasks();
  const createLabel = useCreateLabel();
  const updateLabel = useUpdateLabel();
  const deleteLabel = useDeleteLabel();
  const toast = useToast();
  const [name, setName] = useState('');
  const [color, setColor] = useState<LabelColor>('blue');
  const [error, setError] = useState('');

  const usage = useMemo(() => {
    const counts = new Map<string, number>();
    for (const t of tasks) for (const id of t.labelIds) counts.set(id, (counts.get(id) ?? 0) + 1);
    return counts;
  }, [tasks]);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    try {
      await createLabel.mutateAsync({ name, color });
      setName('');
      setError('');
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  function rename(label: Label, input: HTMLInputElement) {
    if (input.value.trim() === label.name) return;
    updateLabel.mutate(
      { id: label.id, patch: { name: input.value } },
      {
        onError: (err) => {
          input.value = label.name;
          toast.show({ message: errorMessage(err) });
        },
      },
    );
  }

  function recolor(label: Label, next: LabelColor) {
    updateLabel.mutate({ id: label.id, patch: { color: next } }, { onError: (err) => toast.show({ message: errorMessage(err) }) });
  }

  function remove(label: Label) {
    const count = usage.get(label.id) ?? 0;
    if (!window.confirm(`Xoá nhãn "${label.name}"? Nhãn sẽ bị gỡ khỏi ${count} công việc.`)) return;
    deleteLabel.mutate(label.id, { onError: (err) => toast.show({ message: errorMessage(err) }) });
  }

  return (
    <div className="space-y-4">
      {labels.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-zinc-300 px-4 py-5 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          Chưa có nhãn nào. Tạo nhãn đầu tiên ở ô bên dưới.
        </p>
      ) : (
        <ul className="divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-200/70 bg-white dark:divide-zinc-800/70 dark:border-zinc-800/70 dark:bg-zinc-900/40">
          <AnimatePresence initial={false}>
            {labels.map((label) => (
              <motion.li
                key={label.id}
                layout="position"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={spring}
                className="group flex flex-wrap items-center gap-2 px-3 py-2.5"
              >
                <input
                  key={`${label.id}:${label.name}`}
                  aria-label={`Tên nhãn ${label.name}`}
                  className={`${field} min-w-0 flex-1 border-transparent bg-transparent shadow-none hover:border-zinc-200 dark:border-transparent dark:bg-transparent dark:hover:border-zinc-700`}
                  defaultValue={label.name}
                  onBlur={(e) => rename(label, e.currentTarget)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') e.currentTarget.blur();
                  }}
                />
                <span className="font-mono text-xs tabular-nums text-zinc-400 dark:text-zinc-500">
                  {usage.get(label.id) ?? 0} việc
                </span>
                <ColorSelect label={`Màu nhãn ${label.name}`} value={label.color} onChange={(c) => recolor(label, c)} />
                <button
                  type="button"
                  className={`${btn.icon} hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400`}
                  aria-label={`Xoá nhãn ${label.name}`}
                  onClick={() => remove(label)}
                >
                  <TrashIcon className="size-4" aria-hidden="true" />
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
      <form onSubmit={handleAdd} className="flex flex-wrap items-center gap-2">
        <input
          aria-label="Tên nhãn mới"
          placeholder="Tên nhãn mới"
          className={`${field} min-w-40 flex-1`}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError('');
          }}
        />
        <ColorSelect label="Màu nhãn mới" value={color} onChange={setColor} />
        <button type="submit" className={btn.secondary}>
          <PlusIcon weight="bold" className="size-4" aria-hidden="true" />
          Thêm nhãn
        </button>
      </form>
      {error && (
        <p role="alert" className="text-sm text-rose-600 dark:text-rose-400">
          {error}
        </p>
      )}
    </div>
  );
}
