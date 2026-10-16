import { describe, expect, it } from 'vitest';
import { formatDateTime, formatDueLabel } from './format';

const now = new Date(2026, 9, 16, 10, 0);
const at = (d: number, h = 23, m = 59) => new Date(2026, 9, d, h, m).toISOString();

describe('formatDueLabel', () => {
  it('hôm nay / ngày mai / hôm qua, có giờ nếu không phải 23:59', () => {
    expect(formatDueLabel(at(16), now)).toBe('Hôm nay');
    expect(formatDueLabel(at(16, 15, 30), now)).toBe('Hôm nay 15:30');
    expect(formatDueLabel(at(17), now)).toBe('Ngày mai');
    expect(formatDueLabel(at(15, 8, 0), now)).toBe('Hôm qua 08:00');
  });
  it('còn N ngày / trễ N ngày', () => {
    expect(formatDueLabel(at(18), now)).toBe('Còn 2 ngày');
    expect(formatDueLabel(at(13), now)).toBe('Trễ 3 ngày');
  });
  it('formatDateTime đầy đủ', () => {
    expect(formatDateTime(at(20, 9, 5))).toBe('20/10/2026 09:05');
  });
});
