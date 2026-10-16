import type { Label, Task } from '../domain/task';

let seq = 0;

export function makeTask(overrides: Partial<Task> = {}): Task {
  seq += 1;
  const ts = new Date(2026, 9, 1, 8, 0).toISOString();
  return {
    id: `t${seq}`,
    title: `Việc ${seq}`,
    description: '',
    status: 'todo',
    priority: 'medium',
    dueAt: null,
    labelIds: [],
    position: 0,
    createdAt: ts,
    updatedAt: ts,
    completedAt: null,
    ...overrides,
  };
}

export function makeLabel(overrides: Partial<Label> = {}): Label {
  seq += 1;
  return { id: `l${seq}`, name: `Nhãn ${seq}`, color: 'blue', ...overrides };
}
