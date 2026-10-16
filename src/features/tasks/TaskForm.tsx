import { CheckIcon } from '@phosphor-icons/react';
import { useId, useState, type FormEvent, type ReactNode } from 'react';
import { btn, field, fieldLabel } from '../../components/ui/styles';
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
import { LABEL_DOT_CLASSES } from '../../lib/labelColors';
import { validateTaskForm, type FormErrors, type TaskFormValues } from './taskFormModel';

function Field({
  id,
  label,
  error,
  errorId,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  errorId?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className={fieldLabel}>
        {label}
      </label>
      {children}
      {error && (
        <p id={errorId} role="alert" className="text-sm text-rose-600 dark:text-rose-400">
          {error}
        </p>
      )}
    </div>
  );
}

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

  const invalid = 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15 dark:border-rose-500/60';

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <Field id={`${id}-title`} label="Tên công việc" error={errors.title} errorId={`${id}-title-error`}>
        <input
          id={`${id}-title`}
          className={`${field} h-11 w-full text-base ${errors.title ? invalid : ''}`}
          placeholder="Nộp báo cáo thuế quý 3"
          value={values.title}
          onChange={(e) => set('title', e.target.value)}
          aria-invalid={errors.title ? true : undefined}
          aria-describedby={errors.title ? `${id}-title-error` : undefined}
        />
      </Field>

      <Field id={`${id}-desc`} label="Mô tả" error={errors.description}>
        <textarea
          id={`${id}-desc`}
          className={`${field} h-auto w-full resize-y py-2 leading-relaxed`}
          rows={3}
          placeholder="Ghi chú thêm, đường dẫn, các bước cần làm..."
          value={values.description}
          onChange={(e) => set('description', e.target.value)}
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field id={`${id}-status`} label="Trạng thái">
          <select
            id={`${id}-status`}
            className={`${field} w-full`}
            value={values.status}
            onChange={(e) => set('status', e.target.value as TaskStatus)}
          >
            {TASK_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </Field>
        <Field id={`${id}-priority`} label="Ưu tiên">
          <select
            id={`${id}-priority`}
            className={`${field} w-full`}
            value={values.priority}
            onChange={(e) => set('priority', e.target.value as Priority)}
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_LABELS[p]}
              </option>
            ))}
          </select>
        </Field>
        <Field id={`${id}-date`} label="Hạn chót">
          <input
            id={`${id}-date`}
            type="date"
            className={`${field} w-full`}
            value={values.dueDate}
            onChange={(e) => {
              set('dueDate', e.target.value);
              if (!e.target.value) set('dueTime', '');
            }}
          />
        </Field>
        <Field id={`${id}-time`} label="Giờ (tuỳ chọn)" error={errors.dueTime}>
          <input
            id={`${id}-time`}
            type="time"
            className={`${field} w-full ${errors.dueTime ? invalid : ''}`}
            value={values.dueTime}
            disabled={!values.dueDate}
            onChange={(e) => set('dueTime', e.target.value)}
            aria-invalid={errors.dueTime ? true : undefined}
          />
        </Field>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className={`${fieldLabel} mb-2`}>Nhãn</legend>
        {labels.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Chưa có nhãn nào. Bạn có thể tạo nhãn trong Cài đặt.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {labels.map((label) => {
              const checked = values.labelIds.includes(label.id);
              return (
                <label
                  key={label.id}
                  className={`relative flex cursor-pointer items-center gap-2 rounded-full border py-1 pl-2.5 pr-3 text-sm transition-colors has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-brand-500/20 ${
                    checked
                      ? 'border-brand-500 bg-brand-50 text-brand-800 dark:border-brand-500/70 dark:bg-brand-500/10 dark:text-brand-200'
                      : 'border-zinc-200 text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-600'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="absolute inset-0 cursor-pointer opacity-0"
                    checked={checked}
                    onChange={() => toggleLabel(label.id)}
                  />
                  {checked ? (
                    <CheckIcon weight="bold" className="size-3 text-brand-600 dark:text-brand-400" aria-hidden="true" />
                  ) : (
                    <span className={`size-2 rounded-full ${LABEL_DOT_CLASSES[label.color]}`} aria-hidden="true" />
                  )}
                  {label.name}
                </label>
              );
            })}
          </div>
        )}
      </fieldset>

      <div className="-mx-6 -mb-6 mt-1 flex justify-end gap-2 border-t border-zinc-100 bg-zinc-50/60 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900/60">
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
