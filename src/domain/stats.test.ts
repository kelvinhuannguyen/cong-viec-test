import { describe, expect, it } from 'vitest';
import { makeTask } from '../test/factories';
import { completionsByDay, completionsByWeek, dueSoonTasks, overdueTasks, summarize } from './stats';

// 16/10/2026 là thứ Sáu; tuần bắt đầu thứ Hai 12/10.
const now = new Date(2026, 9, 16, 10, 0);
const iso = (y: number, m: number, d: number, h = 9, min = 0) => new Date(y, m - 1, d, h, min).toISOString();
const done = (completedAt: string) => makeTask({ status: 'done', completedAt });

describe('summarize', () => {
  it('đếm theo trạng thái và tỉ lệ hoàn thành làm tròn', () => {
    const tasks = [makeTask(), makeTask(), done(iso(2026, 10, 16)), makeTask({ status: 'in_progress' })];
    expect(summarize(tasks)).toEqual({
      total: 4,
      byStatus: { todo: 2, in_progress: 1, done: 1, on_hold: 0 },
      completionRate: 25,
    });
  });
  it('không có việc thì 0%', () => {
    expect(summarize([]).completionRate).toBe(0);
  });
  it('1/3 làm tròn thành 33', () => {
    expect(summarize([makeTask(), makeTask(), done(iso(2026, 10, 1))]).completionRate).toBe(33);
  });
});

describe('completionsByDay', () => {
  it('7 ngày gần nhất tính cả hôm nay, cũ trước', () => {
    const tasks = [done(iso(2026, 10, 16, 9)), done(iso(2026, 10, 15, 20)), done(iso(2026, 10, 9))];
    const buckets = completionsByDay(tasks, now);
    expect(buckets.map((b) => b.label)).toEqual(['10/10', '11/10', '12/10', '13/10', '14/10', '15/10', '16/10']);
    expect(buckets.map((b) => b.count)).toEqual([0, 0, 0, 0, 0, 1, 1]);
    expect(buckets[6].key).toBe('2026-10-16');
  });
});

describe('completionsByWeek', () => {
  it('8 tuần gần nhất, tuần bắt đầu thứ Hai', () => {
    const tasks = [
      done(iso(2026, 10, 12, 0, 30)), // thứ Hai tuần này
      done(iso(2026, 10, 11, 23)), // Chủ nhật tuần trước
      done(iso(2026, 8, 23)), // trước khoảng
    ];
    const buckets = completionsByWeek(tasks, now);
    expect(buckets.map((b) => b.label)).toEqual(['24/08', '31/08', '07/09', '14/09', '21/09', '28/09', '05/10', '12/10']);
    expect(buckets.map((b) => b.count)).toEqual([0, 0, 0, 0, 0, 0, 1, 1]);
  });
});

describe('overdueTasks / dueSoonTasks', () => {
  it('trễ hạn: trễ lâu nhất lên đầu', () => {
    const t1 = makeTask({ title: 'Trễ 1 ngày', dueAt: iso(2026, 10, 15) });
    const t2 = makeTask({ title: 'Trễ 3 ngày', dueAt: iso(2026, 10, 13) });
    const t3 = makeTask({ title: 'Xong rồi', dueAt: iso(2026, 10, 13), status: 'done' });
    expect(overdueTasks([t1, t2, t3], now).map((t) => t.title)).toEqual(['Trễ 3 ngày', 'Trễ 1 ngày']);
  });
  it('sắp đến hạn: gần nhất lên đầu, chỉ trong 3 ngày', () => {
    const t1 = makeTask({ title: 'Còn 2 ngày', dueAt: iso(2026, 10, 18) });
    const t2 = makeTask({ title: 'Còn 2 giờ', dueAt: iso(2026, 10, 16, 12) });
    const t3 = makeTask({ title: 'Còn 5 ngày', dueAt: iso(2026, 10, 21) });
    expect(dueSoonTasks([t1, t2, t3], now).map((t) => t.title)).toEqual(['Còn 2 giờ', 'Còn 2 ngày']);
  });
});
