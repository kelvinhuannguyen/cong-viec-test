import { format } from 'date-fns';
import { z } from 'zod';
import { LABEL_COLORS, PRIORITIES, TASK_STATUSES, type Label, type Task } from '../domain/task';

export const BACKUP_APP = 'cong-viec-cua-toi';

const taskSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(200),
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
  name: z.string().min(1).max(30),
  color: z.enum(LABEL_COLORS),
});

export const backupSchema = z.object({
  app: z.literal(BACKUP_APP),
  version: z.literal(1),
  exportedAt: z.iso.datetime(),
  tasks: z.array(taskSchema),
  labels: z.array(labelSchema),
});

export type BackupFile = z.infer<typeof backupSchema>;

export type ParseResult = { ok: true; data: BackupFile } | { ok: false; error: string };

export interface ImportPreview {
  newTasks: number;
  overwrittenTasks: number;
  newLabels: number;
  overwrittenLabels: number;
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
    return { ok: false, error: 'File không đúng định dạng sao lưu của Công Việc Của Tôi' };
  }
  return { ok: true, data: result.data };
}

export function previewImport(backup: BackupFile, existingTasks: Task[], existingLabels: Label[]): ImportPreview {
  const taskIds = new Set(existingTasks.map((t) => t.id));
  const labelIds = new Set(existingLabels.map((l) => l.id));
  const overwrittenTasks = backup.tasks.filter((t) => taskIds.has(t.id)).length;
  const overwrittenLabels = backup.labels.filter((l) => labelIds.has(l.id)).length;
  return {
    newTasks: backup.tasks.length - overwrittenTasks,
    overwrittenTasks,
    newLabels: backup.labels.length - overwrittenLabels,
    overwrittenLabels,
  };
}
