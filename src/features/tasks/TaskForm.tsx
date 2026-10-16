import { useId, useState, type FormEvent } from 'react';
import { btn, field } from '../../components/ui/styles';
import {
  PRIORITIES,
  PRIORITY_LABELS,
  STATUS_LABELS,
  TASK_STATUSES,
  type Label,
  type Priority,
  type TaskInput,
  type TaskStatus,
} from '../../domain/task';
import { validateTaskForm, type FormErrors, type TaskFormValues } from './taskFormModel';

export function TaskForm({
  initial,
  labels,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial: TaskFormValues;
  labels: Label[];
  submitLabel: string;
  onSubmit: (input: TaskInput) => Promise<void>;
  onCancel: () => void;
}) {
  const id = useId();
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof TaskFormValues>(key: K, value: TaskFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  function toggleLabel(labelId: string) {
    set(
      'labelIds',
      values.labelIds.includes(labelId) ? values.labelIds.filter((x) => x !== labelId) : [...values.labelIds, labelId],
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const result = validateTaskForm(values);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      await onSubmit(result.input);
    } catch {
      // Hook đã hiện thông báo lỗi; giữ nguyên nội dung form để người dùng thử lại.
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div>
        <label htmlFor={`${id}-title`} className="mb-1 block text-sm font-medium">
          Tên công việc
        </label>
        <input
          id={`${id}-title`}
          className={field}
          value={values.title}
          onChange={(e) => set('title', e.target.value)}
          aria-invalid={errors.title ? true : undefined}
          aria-describedby={errors.title ? `${id}-title-error` : undefined}
        />
        {errors.title && (
          <p id={`${id}-title-error`} role="alert" className="mt-1 text-sm text-red-600">
            {errors.title}
          </p>
        )}
      </div>

      <div>
        <label htmlFor={`${id}-desc`} className="mb-1 block text-sm font-medium">
          Mô tả
        </label>
        <textarea
          id={`${id}-desc`}
          className={field}
          rows={3}
          value={values.description}
          onChange={(e) => set('description', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor={`${id}-status`} className="mb-1 block text-sm font-medium">
            Trạng thái
          </label>
          <select
            id={`${id}-status`}
            className={field}
            value={values.status}
            onChange={(e) => set('status', e.target.value as TaskStatus)}
          >
            {TASK_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${id}-priority`} className="mb-1 block text-sm font-medium">
            Ưu tiên
          </label>
          <select
            id={`${id}-priority`}
            className={field}
            value={values.priority}
            onChange={(e) => set('priority', e.target.value as Priority)}
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_LABELS[p]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${id}-date`} className="mb-1 block text-sm font-medium">
            Hạn chót
          </label>
          <input
            id={`${id}-date`}
            type="date"
            className={field}
            value={values.dueDate}
            onChange={(e) => {
              set('dueDate', e.target.value);
              if (!e.target.value) set('dueTime', '');
            }}
          />
        </div>
        <div>
          <label htmlFor={`${id}-time`} className="mb-1 block text-sm font-medium">
            Giờ (tuỳ chọn)
          </label>
          <input
            id={`${id}-time`}
            type="time"
            className={field}
            value={values.dueTime}
            disabled={!values.dueDate}
            onChange={(e) => set('dueTime', e.target.value)}
            aria-invalid={errors.dueTime ? true : undefined}
          />
          {errors.dueTime && (
            <p role="alert" className="mt-1 text-sm text-red-600">
              {errors.dueTime}
            </p>
          )}
        </div>
      </div>

      <fieldset>
        <legend className="mb-1 text-sm font-medium">Nhãn</legend>
        {labels.length === 0 ? (
          <p className="text-sm text-slate-500">Chưa có nhãn — tạo trong Cài đặt.</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {labels.map((label) => (
              <label key={label.id} className="flex items-center gap-1 text-sm">
                <input
                  type="checkbox"
                  checked={values.labelIds.includes(label.id)}
                  onChange={() => toggleLabel(label.id)}
                />
                {label.name}
              </label>
            ))}
          </div>
        )}
      </fieldset>

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" className={btn.secondary} onClick={onCancel}>
          Huỷ
        </button>
        <button type="submit" className={btn.primary} disabled={saving}>
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
