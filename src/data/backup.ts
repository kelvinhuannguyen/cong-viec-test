import { format } from 'date-fns';
import { z } from 'zod';
import { planLabelImport } from '../domain/importMerge';
import { LABEL_NAME_MAX, TITLE_MAX } from '../domain/rules';
import { LABEL_COLORS, PRIORITIES, TASK_STATUSES, type Label, type Task } from '../domain/task';

export const BACKUP_APP = 'cong-viec-cua-toi';
export const FORMAT_ERROR = 'File không đúng định dạng sao lưu của Công Việc Của Tôi';
export const DUPLICATE_ID_ERROR = 'File sao lưu bị lỗi: có mục trùng id';

/** Cùng cách chuẩn hoá như khi tạo trong ứng dụng (NFC, bỏ khoảng trắng hai đầu). */
const text = (max: number) => z.string().normalize('NFC').trim().min(1).max(max);

function hasDuplicateIds(items: { id: string }[]): boolean {
  return new Set(items.map((i) => i.id)).size !== items.length;
}

const taskSchema = z.object({
  id: z.string().min(1),
  title: text(TITLE_MAX),
  description: z.string(),
  status: z.enum(TASK_STATUSES),
  priority: z.enum(PRIORITIES),
  dueAt: z.iso.datetime().nullable(),
  labelIds: z.array(z.string()),
  position: z.number(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  completedAt: z.iso.datetime().nullable(),
});

const labelSchema = z.object({
  id: z.string().min(1),
  name: text(LABEL_NAME_MAX),
  color: z.enum(LABEL_COLORS),
});

export const backupSchema = z
  .object({
    app: z.literal(BACKUP_APP),
    version: z.literal(1),
    exportedAt: z.iso.datetime(),
    tasks: z.array(taskSchema),
    labels: z.array(labelSchema),
  })
  .superRefine((backup, ctx) => {
    if (hasDuplicateIds(backup.tasks) || hasDuplicateIds(backup.labels)) {
      ctx.addIssue({ code: 'custom', message: DUPLICATE_ID_ERROR });
    }
  });

export type BackupFile = z.infer<typeof backupSchema>;

export type ParseResult = { ok: true; data: BackupFile } | { ok: false; error: string };

export interface ImportPreview {
  newTasks: number;
  overwrittenTasks: number;
  newLabels: number;
  overwrittenLabels: number;
  /** Nhãn trùng tên với nhãn đã có: không tạo thêm, dùng nhãn đã có. */
  mergedLabels: number;
}

export function createBackup(tasks: Task[], labels: Label[], now: Date): BackupFile {
  return { app: BACKUP_APP, version: 1, exportedAt: now.toISOString(), tasks, labels };
}

export function backupFileName(now: Date): string {
  return `${BACKUP_APP}-${format(now, 'yyyy-MM-dd')}.json`;
}

export function parseBackup(text: string): ParseResult {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, error: 'File không phải JSON hợp lệ' };
  }
  const result = backupSchema.safeParse(json);
  if (!result.success) {
    const custom = result.error.issues.find((issue) => issue.code === 'custom');
    return { ok: false, error: custom?.message ?? FORMAT_ERROR };
  }
  return { ok: true, data: result.data };
}

export function previewImport(backup: BackupFile, existingTasks: Task[], existingLabels: Label[]): ImportPreview {
  const taskIds = new Set(existingTasks.map((t) => t.id));
  const overwrittenTasks = backup.tasks.filter((t) => taskIds.has(t.id)).length;
  const labels = planLabelImport(backup.labels, existingLabels);
  return {
    newTasks: backup.tasks.length - overwrittenTasks,
    overwrittenTasks,
    newLabels: labels.added,
    overwrittenLabels: labels.overwritten,
    mergedLabels: labels.merged,
  };
}
