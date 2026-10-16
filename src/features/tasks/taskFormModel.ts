import { z } from 'zod';
import { fromDueAt, toDueAt } from '../../domain/rules';
import { PRIORITIES, TASK_STATUSES, type Priority, type Task, type TaskInput, type TaskStatus } from '../../domain/task';

export interface TaskFormValues {
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  dueDate: string;
  dueTime: string;
  labelIds: string[];
}

export type FormErrors = Partial<Record<keyof TaskFormValues, string>>;

const taskFormSchema = z
  .object({
    title: z.string().trim().min(1, 'Vui lòng nhập tên công việc').max(200, 'Tên tối đa 200 ký tự'),
    description: z.string().max(10000, 'Mô tả tối đa 10.000 ký tự'),
    status: z.enum(TASK_STATUSES),
    priority: z.enum(PRIORITIES),
    dueDate: z.string(),
    dueTime: z.string(),
    labelIds: z.array(z.string()),
  })
  .refine((v) => v.dueTime === '' || v.dueDate !== '', {
    message: 'Chọn ngày trước khi chọn giờ',
    path: ['dueTime'],
  });

export function toFormValues(task?: Task): TaskFormValues {
  const { date, time } = fromDueAt(task?.dueAt ?? null);
  return {
    title: task?.title ?? '',
    description: task?.description ?? '',
    status: task?.status ?? 'todo',
    priority: task?.priority ?? 'medium',
    dueDate: date,
    dueTime: time,
    labelIds: task?.labelIds ?? [],
  };
}

export function validateTaskForm(
  values: TaskFormValues,
): { ok: true; input: TaskInput } | { ok: false; errors: FormErrors } {
  const result = taskFormSchema.safeParse(values);
  if (!result.success) {
    const errors: FormErrors = {};
    for (const issue of result.error.issues) {
      const key = issue.path[0] as keyof TaskFormValues;
      errors[key] ??= issue.message;
    }
    return { ok: false, errors };
  }
  const v = result.data;
  return {
    ok: true,
    input: {
      title: v.title,
      description: v.description.trim(),
      status: v.status,
      priority: v.priority,
      dueAt: toDueAt(v.dueDate, v.dueTime),
      labelIds: v.labelIds,
    },
  };
}
