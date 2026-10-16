import { describe, expect, it } from 'vitest';
import { fetchAllPages } from './paginate';

describe('fetchAllPages', () => {
  it('đọc hết các trang cho tới trang thiếu', async () => {
    const rows = Array.from({ length: 7 }, (_, i) => i);
    const calls: [number, number][] = [];
    const result = await fetchAllPages(async (from, to) => {
      calls.push([from, to]);
      return { data: rows.slice(from, to + 1), error: null };
    }, 3);
    expect(result).toEqual({ data: rows, error: null });
    expect(calls).toEqual([
      [0, 2],
      [3, 5],
      [6, 8],
    ]);
  });

  it('số hàng chia hết cho cỡ trang thì đọc thêm một trang rỗng rồi dừng', async () => {
    const rows = [1, 2, 3, 4];
    const result = await fetchAllPages(async (from, to) => ({ data: rows.slice(from, to + 1), error: null }), 2);
    expect(result.data).toEqual(rows);
  });

  it('gặp lỗi thì trả lỗi về', async () => {
    const result = await fetchAllPages(async () => ({ data: null, error: { code: '42501' } }));
    expect(result.error).toEqual({ code: '42501' });
  });
});
