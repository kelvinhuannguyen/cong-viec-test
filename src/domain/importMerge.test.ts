import { describe, expect, it } from 'vitest';
import { makeLabel, makeTask } from '../test/factories';
import { planLabelImport, reassignIds, remapTaskLabels } from './importMerge';

describe('planLabelImport', () => {
  it('thêm mới, ghi đè theo id, gộp nhãn trùng tên khác id', () => {
    const work = makeLabel({ name: 'Công việc' });
    const home = makeLabel({ name: 'Nhà' });
    const incoming = [
      makeLabel({ name: 'Mới' }),
      { ...home, name: 'Nhà cửa' },
      makeLabel({ name: ' CÔNG VIỆC ' }),
    ];
    const plan = planLabelImport(incoming, [work, home]);
    expect(plan.labels).toEqual([incoming[0], incoming[1]]);
    expect(plan.idMap).toEqual(new Map([[incoming[2].id, work.id]]));
    expect(plan).toMatchObject({ added: 1, overwritten: 1, merged: 1 });
  });

  it('cùng id thì ghi đè dù chỉ khác hoa thường', () => {
    const label = makeLabel({ name: 'Nhà' });
    const plan = planLabelImport([{ ...label, name: 'NHÀ' }], [label]);
    expect(plan).toMatchObject({ labels: [{ ...label, name: 'NHÀ' }], added: 0, overwritten: 1, merged: 0 });
  });

  it('hai nhãn trong file trùng tên thì chỉ giữ nhãn đầu', () => {
    const a = makeLabel({ name: 'Học' });
    const b = makeLabel({ name: 'học' });
    const plan = planLabelImport([a, b], []);
    expect(plan.labels).toEqual([a]);
    expect(plan.idMap).toEqual(new Map([[b.id, a.id]]));
  });

  it('đổi tên nhãn đã có thành tên của nhãn khác thì gộp, không tạo hai nhãn trùng', () => {
    const a = makeLabel({ name: 'A' });
    const b = makeLabel({ name: 'B' });
    const plan = planLabelImport([{ ...a, name: 'b' }], [a, b]);
    expect(plan.labels).toEqual([]);
    expect(plan.idMap).toEqual(new Map([[a.id, b.id]]));
  });
});

it('remapTaskLabels đổi id và bỏ nhãn lặp', () => {
  const task = makeTask({ labelIds: ['x', 'y', 'z'] });
  const [remapped] = remapTaskLabels([task], new Map([['x', 'y']]));
  expect(remapped.labelIds).toEqual(['y', 'z']);
  expect(remapTaskLabels([task], new Map())).toEqual([task]);
});

describe('reassignIds', () => {
  it('đổi id việc và nhãn, giữ liên kết nhãn, bỏ nhãn không tồn tại', () => {
    const label = makeLabel({ id: 'l-cu' });
    const task = makeTask({ id: 't-cu', labelIds: ['l-cu', 'mat-tich'] });
    let n = 0;
    const result = reassignIds({ tasks: [task], labels: [label] }, () => `moi-${++n}`);
    expect(result.labels).toEqual([{ ...label, id: 'moi-1' }]);
    expect(result.tasks).toEqual([{ ...task, id: 'moi-2', labelIds: ['moi-1'] }]);
  });
});
