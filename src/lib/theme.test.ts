import { describe, expect, it } from 'vitest';
import { applyTheme, resolveTheme } from './theme';

describe('theme', () => {
  it('resolveTheme theo lựa chọn hoặc theo hệ thống', () => {
    expect(resolveTheme('dark', false)).toBe('dark');
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('system', false)).toBe('light');
  });
  it('applyTheme bật / tắt class dark trên <html>', () => {
    applyTheme('dark');
    expect(document.documentElement).toHaveClass('dark');
    applyTheme('light');
    expect(document.documentElement).not.toHaveClass('dark');
  });
});
