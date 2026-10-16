import { sameLabelName } from './rules';
import type { Label, Task } from './task';

export interface LabelImportPlan {
  /** Nhãn cần ghi: thêm mới hoặc ghi đè theo id. */
  labels: Label[];
  /** id nhãn trong file → id nhãn đã có cùng tên (không phân biệt hoa thường). */
  idMap: Map<string, string>;
  added: number;
  overwritten: number;
  merged: number;
}

/**
 * Gộp nhãn nhập vào với nhãn đang có. Nhãn trùng tên với một nhãn khác id thì không tạo thêm
 * mà dùng luôn nhãn đó, để không bao giờ có hai nhãn chỉ khác nhau chữ hoa / thường.
 */
export function planLabelImport(incoming: Label[], existing: Label[]): LabelImportPlan {
  const working = new Map(existing.map((l) => [l.id, l]));
  const plan: LabelImportPlan = { labels: [], idMap: new Map(), added: 0, overwritten: 0, merged: 0 };
  for (const label of incoming) {
    const clash = [...working.values()].find((l) => l.id !== label.id && sameLabelName(l.name, label.name));
    if (clash) {
      plan.idMap.set(label.id, clash.id);
      plan.merged += 1;
      continue;
    }
    if (working.has(label.id)) plan.overwritten += 1;
    else plan.added += 1;
    working.set(label.id, label);
    plan.labels.push(label);
  }
  return plan;
}

/** Đổi id nhãn của các việc theo idMap, bỏ nhãn lặp sau khi đổi. */
export function remapTaskLabels(tasks: Task[], idMap: Map<string, string>): Task[] {
  if (idMap.size === 0) return tasks;
  return tasks.map((task) => ({
    ...task,
    labelIds: [...new Set(task.labelIds.map((id) => idMap.get(id) ?? id))],
  }));
}
