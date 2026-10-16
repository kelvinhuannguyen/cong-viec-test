import { describe, expect, it } from 'vitest';
import { makeTask } from '../test/factories';
import {
  applyStatusChange,
  fromDueAt,
  isDueSoon,
  isOverdue,
  normalizeLabelName,
  normalizeTitle,
  sameLabelName,
  toDueAt,
} from './rules';

const now = new Date(2026, 9, 16, 10, 0);
const iso = (d: Date) => d.toISOString();
const hoursFromNow = (h: number) => iso(new Date(now.getTime() + h * 3_600_000));

describe('applyStatusChange', () => {
  it('chuyển sang Đã xong thì ghi completedAt', () => {
    expect(applyStatusChange({ status: 'todo', completedAt: null }, 'done', now)).toEqual({
      status: 'done',
      completedAt: iso(now),
    });
  });
  it('rời khỏi Đã xong thì xoá completedAt', () => {
    expect(applyStatusChange({ status: 'done', completedAt: iso(now) }, 'todo', now)).toEqual({
      status: 'todo',
      completedAt: null,
    });
  });
  it('Đã xong sang Đã xong thì giữ completedAt cũ', () => {
    const old = iso(new Date(2026, 9, 1));
    expect(applyStatusChange({ status: 'done', completedAt: old }, 'done', now)).toEqual({
      status: 'done',
      completedAt: old,
    });
  });
  it('đổi giữa các trạng thái chưa xong thì completedAt là null', () => {
    expect(applyStatusChange({ status: 'in_progress', completedAt: null }, 'on_hold', now)).toEqual({
      status: 'on_hold',
      completedAt: null,
    });
  });
});

describe('isOverdue', () => {
  it('quá hạn và chưa xong', () => {
    expect(isOverdue(makeTask({ dueAt: hoursFromNow(-1) }), now)).toBe(true);
  });
  it('đã xong thì không trễ', () => {
    expect(isOverdue(makeTask({ dueAt: hoursFromNow(-1), status: 'done' }), now)).toBe(false);
  });
  it('không có hạn thì không trễ', () => {
    expect(isOverdue(makeTask({ dueAt: null }), now)).toBe(false);
  });
  it('hạn ở tương lai thì không trễ', () => {
    expect(isOverdue(makeTask({ dueAt: hoursFromNow(1) }), now)).toBe(false);
  });
  it('Tạm hoãn vẫn tính trễ', () => {
    expect(isOverdue(makeTask({ dueAt: hoursFromNow(-1), status: 'on_hold' }), now)).toBe(true);
  });
});

describe('isDueSoon', () => {
  it('trong 3 ngày tới', () => {
    expect(isDueSoon(makeTask({ dueAt: hoursFromNow(48) }), now)).toBe(true);
  });
  it('đúng thời điểm hiện tại vẫn tính', () => {
    expect(isDueSoon(makeTask({ dueAt: iso(now) }), now)).toBe(true);
  });
  it('xa hơn 3 ngày thì không', () => {
    expect(isDueSoon(makeTask({ dueAt: hoursFromNow(96) }), now)).toBe(false);
  });
  it('đã quá hạn thì không', () => {
    expect(isDueSoon(makeTask({ dueAt: hoursFromNow(-1) }), now)).toBe(false);
  });
  it('đã xong thì không', () => {
    expect(isDueSoon(makeTask({ dueAt: hoursFromNow(5), status: 'done' }), now)).toBe(false);
  });
});

describe('normalizeTitle / normalizeLabelName', () => {
  it('cắt khoảng trắng hai đầu', () => {
    expect(normalizeTitle('  Viết báo cáo  ')).toBe('Viết báo cáo');
  });
  it('rỗng thì null', () => {
    expect(normalizeTitle('   ')).toBeNull();
  });
  it('200 ký tự được, 201 thì null', () => {
    expect(normalizeTitle('a'.repeat(200))).toBe('a'.repeat(200));
    expect(normalizeTitle('a'.repeat(201))).toBeNull();
  });
  it('tên nhãn tối đa 30 ký tự', () => {
    expect(normalizeLabelName('a'.repeat(30))).toBe('a'.repeat(30));
    expect(normalizeLabelName('a'.repeat(31))).toBeNull();
  });
  it('so tên nhãn không phân biệt hoa thường', () => {
    expect(sameLabelName('Công việc', '  CÔNG VIỆC ')).toBe(true);
    expect(sameLabelName('Công việc', 'Cá nhân')).toBe(false);
    expect(sameLabelName('Vi\u1EC7c', 'Vie\u0323\u0302c')).toBe(true); // dựng sẵn so với tổ hợp
  });
});

describe('toDueAt / fromDueAt', () => {
  it('chỉ có ngày thì đặt 23:59 giờ địa phương', () => {
    expect(toDueAt('2026-10-20', '')).toBe(new Date(2026, 9, 20, 23, 59).toISOString());
  });
  it('có giờ thì dùng giờ đó', () => {
    expect(toDueAt('2026-10-20', '09:30')).toBe(new Date(2026, 9, 20, 9, 30).toISOString());
  });
  it('không có ngày thì null', () => {
    expect(toDueAt('', '09:30')).toBeNull();
  });
  it('fromDueAt đảo ngược toDueAt; 23:59 hiển thị giờ trống', () => {
    expect(fromDueAt(toDueAt('2026-10-20', ''))).toEqual({ date: '2026-10-20', time: '' });
    expect(fromDueAt(toDueAt('2026-01-05', '07:05'))).toEqual({ date: '2026-01-05', time: '07:05' });
    expect(fromDueAt(null)).toEqual({ date: '', time: '' });
  });
});
