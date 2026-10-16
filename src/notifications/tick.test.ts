import { describe, expect, it, vi } from 'vitest';
import { reminderKey } from '../domain/reminders';
import { makeTask } from '../test/factories';
import type { AppNotification } from './notifier';
import { runReminderTick, type ReminderStore } from './tick';

const now = new Date(2026, 9, 16, 10, 0);
const at = (d: number, h: number, m = 0) => new Date(2026, 9, d, h, m).toISOString();

function memoryStore(initial: Partial<{ sent: string[]; last: string | null }> = {}) {
  let sent = initial.sent ?? [];
  let last = initial.last ?? null;
  const store: ReminderStore = {
    getSent: () => sent,
    setSent: (keys) => {
      sent = keys;
    },
    getLastSummaryDate: () => last,
    setLastSummaryDate: (d) => {
      last = d;
    },
  };
  return { store, sent: () => sent, last: () => last };
}

describe('runReminderTick', () => {
  const soon = makeTask({ id: 'soon', title: 'Họp nhóm', dueAt: at(16, 10, 30) });
  const late = makeTask({ id: 'late', title: 'Nộp thuế', dueAt: at(16, 8) });

  it('lần đầu trong ngày: tóm tắt + nhắc từng việc; lần sau không lặp', () => {
    const notify = vi.fn((_n: AppNotification) => true);
    const mem = memoryStore();
    runReminderTick([soon, late], now, mem.store, notify, { prune: true });
    expect(notify.mock.calls.map(([n]) => n)).toEqual([
      { title: 'Công Việc Của Tôi', body: 'Hôm nay có 1 việc đến hạn, 1 việc đang trễ' },
      { title: 'Sắp đến hạn', body: 'Họp nhóm', taskId: 'soon' },
      { title: 'Đã trễ hạn', body: 'Nộp thuế', taskId: 'late' },
    ]);
    expect(mem.last()).toBe('2026-10-16');
    expect(mem.sent()).toEqual([reminderKey(soon, 'due_soon'), reminderKey(late, 'overdue')]);

    notify.mockClear();
    runReminderTick([soon, late], now, mem.store, notify, { prune: false });
    expect(notify).not.toHaveBeenCalled();
  });

  it('không có gì đến hạn thì không gửi tóm tắt nhưng vẫn ghi ngày', () => {
    const notify = vi.fn((_n: AppNotification) => true);
    const mem = memoryStore();
    runReminderTick([makeTask({ dueAt: at(25, 9) })], now, mem.store, notify, { prune: true });
    expect(notify).not.toHaveBeenCalled();
    expect(mem.last()).toBe('2026-10-16');
  });

  it('prune dọn khoá cũ', () => {
    const mem = memoryStore({ sent: ['xoa-roi:2026-10-01T00:00:00.000Z:overdue'], last: '2026-10-16' });
    runReminderTick([], now, mem.store, vi.fn((_n: AppNotification) => true), { prune: true });
    expect(mem.sent()).toEqual([]);
  });

  it('thông báo không hiện được (notify trả false) thì không ghi nhận, lần sau thử lại', () => {
    const mem = memoryStore();
    const failing = vi.fn((_n: AppNotification) => false);
    runReminderTick([soon, late], now, mem.store, failing, { prune: true });
    expect(failing).toHaveBeenCalledTimes(3);
    expect(mem.sent()).toEqual([]);
    expect(mem.last()).toBeNull();

    const working = vi.fn((_n: AppNotification) => true);
    runReminderTick([soon, late], now, mem.store, working, { prune: false });
    expect(working.mock.calls.map(([n]) => n.title)).toEqual(['Công Việc Của Tôi', 'Sắp đến hạn', 'Đã trễ hạn']);
    expect(mem.last()).toBe('2026-10-16');
    expect(mem.sent()).toEqual([reminderKey(soon, 'due_soon'), reminderKey(late, 'overdue')]);

    working.mockClear();
    runReminderTick([soon, late], now, mem.store, working, { prune: false });
    expect(working).not.toHaveBeenCalled();
  });
});
