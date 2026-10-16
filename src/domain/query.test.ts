import { describe, expect, it } from 'vitest';
import { makeTask } from '../test/factories';
import {
  countByStatus,
  filterByStatus,
  normalizeText,
  parseSortKey,
  parseStatusFilter,
  searchTasks,
  sortTasks,
} from './query';

const at = (day: number, hour = 9) => new Date(2026, 9, day, hour).toISOString();

describe('normalizeText', () => {
  it('bỏ dấu tiếng Việt, kể cả đ/Đ, và chữ hoa', () => {
    expect(normalizeText('  Đọc BÁO cáo  ')).toBe('doc bao cao');
  });
});

describe('searchTasks', () => {
  const tasks = [makeTask({ title: 'Viết báo cáo quý' }), makeTask({ title: 'Mua sữa' })];
  it('khớp chuỗi con không dấu, không phân biệt hoa thường', () => {
    expect(searchTasks(tasks, 'BAO cao').map((t) => t.title)).toEqual(['Viết báo cáo quý']);
    expect(searchTasks(tasks, 'sữa').map((t) => t.title)).toEqual(['Mua sữa']);
  });
  it('từ khoá rỗng trả về tất cả', () => {
    expect(searchTasks(tasks, '   ')).toHaveLength(2);
  });
});

describe('filterByStatus / countByStatus', () => {
  const tasks = [
    makeTask({ status: 'todo' }),
    makeTask({ status: 'todo' }),
    makeTask({ status: 'in_progress' }),
    makeTask({ status: 'done' }),
  ];
  it('lọc theo trạng thái; all trả về tất cả', () => {
    expect(filterByStatus(tasks, 'todo')).toHaveLength(2);
    expect(filterByStatus(tasks, 'all')).toHaveLength(4);
  });
  it('đếm theo từng trạng thái', () => {
    expect(countByStatus(tasks)).toEqual({ all: 4, todo: 2, in_progress: 1, done: 1, on_hold: 0 });
  });
});

describe('sortTasks', () => {
  const a = makeTask({ title: 'A', dueAt: at(20), priority: 'low', createdAt: at(1) });
  const b = makeTask({ title: 'B', dueAt: null, priority: 'high', createdAt: at(3) });
  const c = makeTask({ title: 'C', dueAt: at(18), priority: 'high', createdAt: at(2) });
  const d = makeTask({ title: 'D', dueAt: null, priority: 'medium', createdAt: at(4) });
  const titles = (list: { title: string }[]) => list.map((t) => t.title);

  it('due: hạn sớm trước, không có hạn xếp cuối (mới tạo trước)', () => {
    expect(titles(sortTasks([a, b, c, d], 'due'))).toEqual(['C', 'A', 'D', 'B']);
  });
  it('priority: Cao → Thấp, cùng mức thì theo hạn', () => {
    expect(titles(sortTasks([a, b, c, d], 'priority'))).toEqual(['C', 'B', 'D', 'A']);
  });
  it('created: mới nhất trước', () => {
    expect(titles(sortTasks([a, b, c, d], 'created'))).toEqual(['D', 'B', 'C', 'A']);
  });
  it('không sửa mảng gốc', () => {
    const input = [a, b];
    sortTasks(input, 'created');
    expect(titles(input)).toEqual(['A', 'B']);
  });
});

describe('parse URL params', () => {
  it('trạng thái hợp lệ hoặc all', () => {
    expect(parseStatusFilter('in_progress')).toBe('in_progress');
    expect(parseStatusFilter('xyz')).toBe('all');
    expect(parseStatusFilter(null)).toBe('all');
  });
  it('kiểu sắp xếp hợp lệ hoặc due', () => {
    expect(parseSortKey('priority')).toBe('priority');
    expect(parseSortKey('abc')).toBe('due');
    expect(parseSortKey(null)).toBe('due');
  });
});
