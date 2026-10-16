import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { readPref, usePref, writePref } from './prefs';

describe('prefs', () => {
  it('trả về giá trị mặc định khi chưa có', () => {
    expect(readPref('cvct.test', 'list')).toBe('list');
  });
  it('ghi rồi đọc lại', () => {
    writePref('cvct.test', { a: 1 });
    expect(readPref('cvct.test', null)).toEqual({ a: 1 });
  });
  it('JSON hỏng thì dùng mặc định', () => {
    localStorage.setItem('cvct.test', '{oops');
    expect(readPref('cvct.test', 'x')).toBe('x');
  });
  it('usePref cập nhật mọi nơi đang dùng cùng khoá', () => {
    const first = renderHook(() => usePref('cvct.view', 'list'));
    const second = renderHook(() => usePref('cvct.view', 'list'));
    act(() => first.result.current[1]('kanban'));
    expect(second.result.current[0]).toBe('kanban');
  });
});
