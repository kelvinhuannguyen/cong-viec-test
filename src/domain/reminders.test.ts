import { describe, expect, it } from 'vitest';
import { makeTask } from '../test/factories';
import { dailySummary, dueReminders, pruneSentKeys, reminderKey } from './reminders';

const now = new Date(2026, 9, 16, 10, 0);
const at = (d: number, h: number, m = 0) => new Date(2026, 9, d, h, m).toISOString();

const soon = makeTask({ id: 'soon', title: 'Còn 30 phút', dueAt: at(16, 10, 30) });
const justLate = makeTask({ id: 'late', title: 'Trễ 2 giờ', dueAt: at(16, 8) });
const longLate = makeTask({ id: 'old', title: 'Trễ 2 ngày', dueAt: at(14, 9) });
const later = makeTask({ id: 'later', title: 'Còn 2 giờ', dueAt: at(16, 12) });
const finished = makeTask({ id: 'fin', title: 'Đã xong', dueAt: at(16, 10, 15), status: 'done' });
const all = [soon, justLate, longLate, later, finished];

describe('dueReminders', () => {
  it('nhắc việc còn ≤ 1 giờ và việc trễ ≤ 24 giờ', () => {
    const result = dueReminders(all, now, new Set());
    expect(result.map((r) => [r.task.id, r.kind])).toEqual([
      ['soon', 'due_soon'],
      ['late', 'overdue'],
    ]);
    expect(result[0].key).toBe(`soon:${soon.dueAt}:due_soon`);
  });
  it('bỏ qua khoá đã nhắc', () => {
    const sent = new Set([reminderKey(soon, 'due_soon')]);
    expect(dueReminders(all, now, sent).map((r) => r.task.id)).toEqual(['late']);
  });
});

describe('dailySummary', () => {
  it('đếm việc đến hạn hôm nay (chưa trễ) và việc đang trễ', () => {
    expect(dailySummary(all, now)).toEqual({ dueToday: 2, overdue: 2 });
  });
  it('không có gì thì null', () => {
    expect(dailySummary([makeTask({ dueAt: at(20, 9) })], now)).toBeNull();
  });
});

describe('pruneSentKeys', () => {
  it('giữ khoá của việc còn tồn tại, chưa xong, đúng dueAt hiện tại', () => {
    const keys = [
      reminderKey(soon, 'due_soon'),
      `soon:${at(1, 9)}:due_soon`, // dueAt cũ
      reminderKey(finished, 'due_soon'), // đã xong
      'deleted:2026-10-01T00:00:00.000Z:overdue', // đã xoá
    ];
    expect(pruneSentKeys(keys, all)).toEqual([reminderKey(soon, 'due_soon')]);
  });
});
