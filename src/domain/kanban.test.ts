import { describe, expect, it } from 'vitest';
import { makeTask } from '../test/factories';
import { computeDrop, sortByPosition, topPosition } from './kanban';

describe('topPosition', () => {
  it('cột rỗng thì 0', () => {
    expect(topPosition([])).toBe(0);
  });
  it('nhỏ hơn vị trí nhỏ nhất 1 đơn vị', () => {
    expect(topPosition([makeTask({ position: 3 }), makeTask({ position: -1 }), makeTask({ position: 2 })])).toBe(-2);
  });
});

describe('sortByPosition', () => {
  it('theo position tăng dần, bằng nhau thì mới tạo trước', () => {
    const x = makeTask({ id: 'x', position: 1, createdAt: new Date(2026, 9, 1).toISOString() });
    const y = makeTask({ id: 'y', position: 1, createdAt: new Date(2026, 9, 2).toISOString() });
    const z = makeTask({ id: 'z', position: 0 });
    expect(sortByPosition([x, y, z]).map((t) => t.id)).toEqual(['z', 'y', 'x']);
  });
});

describe('computeDrop', () => {
  const board = () => [
    makeTask({ id: 'a', status: 'todo', position: 0 }),
    makeTask({ id: 'b', status: 'todo', position: 1 }),
    makeTask({ id: 'c', status: 'todo', position: 2 }),
    makeTask({ id: 'd', status: 'in_progress', position: 0 }),
  ];

  it('kéo xuống trong cùng cột: thả lên c thì a đứng sau c', () => {
    expect(computeDrop(board(), 'a', 'todo', 'c')).toEqual([
      { id: 'b', patch: { position: 0 } },
      { id: 'c', patch: { position: 1 } },
      { id: 'a', patch: { position: 2 } },
    ]);
  });

  it('kéo lên trong cùng cột: thả c lên a thì c đứng trước a', () => {
    expect(computeDrop(board(), 'c', 'todo', 'a')).toEqual([
      { id: 'c', patch: { position: 0 } },
      { id: 'a', patch: { position: 1 } },
      { id: 'b', patch: { position: 2 } },
    ]);
  });

  it('thả vào vùng trống của cột khác: xuống cuối và đổi trạng thái', () => {
    expect(computeDrop(board(), 'a', 'in_progress', null)).toEqual([
      { id: 'a', patch: { status: 'in_progress', position: 1 } },
    ]);
  });

  it('thả lên một thẻ ở cột khác: chen vào trước thẻ đó', () => {
    expect(computeDrop(board(), 'a', 'in_progress', 'd')).toEqual([
      { id: 'a', patch: { status: 'in_progress', position: 0 } },
      { id: 'd', patch: { position: 1 } },
    ]);
  });

  it('thả lên chính nó hoặc id lạ thì không làm gì', () => {
    expect(computeDrop(board(), 'b', 'todo', 'b')).toEqual([]);
    expect(computeDrop(board(), 'khong-co', 'todo', null)).toEqual([]);
  });
});
