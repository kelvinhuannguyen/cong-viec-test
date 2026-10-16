import { useMemo, useState, type FormEvent } from 'react';
import { useToast } from '../../components/ui/Toast';
import { btn, field } from '../../components/ui/styles';
import { LABEL_COLORS, type Label, type LabelColor } from '../../domain/task';
import { useCreateLabel, useDeleteLabel, useLabels, useUpdateLabel } from '../../hooks/useLabels';
import { useTasks } from '../../hooks/useTasks';
import { errorMessage } from '../../lib/errors';
import { LABEL_COLOR_CLASSES, LABEL_COLOR_NAMES } from '../../lib/labelColors';

function ColorSelect({ label, value, onChange }: { label: string; value: LabelColor; onChange: (c: LabelColor) => void }) {
  return (
    <select aria-label={label} className={`${field} w-auto`} value={value} onChange={(e) => onChange(e.target.value as LabelColor)}>
      {LABEL_COLORS.map((c) => (
        <option key={c} value={c}>
          {LABEL_COLOR_NAMES[c]}
        </option>
      ))}
    </select>
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
        <p className="text-sm text-slate-500">Chưa có nhãn nào.</p>
      ) : (
        <ul className="space-y-2">
          {labels.map((label) => (
            <li key={label.id} className="flex flex-wrap items-center gap-2">
              <span className={`size-3 shrink-0 rounded-full ${LABEL_COLOR_CLASSES[label.color]}`} aria-hidden="true" />
              <input
                key={`${label.id}:${label.name}`}
                aria-label={`Tên nhãn ${label.name}`}
                className={`${field} w-44`}
                defaultValue={label.name}
                onBlur={(e) => rename(label, e.currentTarget)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.currentTarget.blur();
                }}
              />
              <ColorSelect label={`Màu nhãn ${label.name}`} value={label.color} onChange={(c) => recolor(label, c)} />
              <span className="text-xs text-slate-500">{usage.get(label.id) ?? 0} việc</span>
              <button type="button" className={btn.danger} aria-label={`Xoá nhãn ${label.name}`} onClick={() => remove(label)}>
                Xoá
              </button>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={handleAdd} className="flex flex-wrap items-center gap-2">
        <input
          aria-label="Tên nhãn mới"
          placeholder="Tên nhãn mới"
          className={`${field} w-44`}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError('');
          }}
        />
        <ColorSelect label="Màu nhãn mới" value={color} onChange={setColor} />
        <button type="submit" className={btn.secondary}>
          Thêm nhãn
        </button>
      </form>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
