import { describe, expect, it } from 'vitest';
import { toDueAt } from '../../domain/rules';
import { makeTask } from '../../test/factories';
import { toFormValues, validateTaskForm } from './taskFormModel';

describe('taskForm', () => {
  it('giá trị mặc định cho việc mới', () => {
    expect(toFormValues()).toEqual({
      title: '',
      description: '',
      status: 'todo',
      priority: 'medium',
      dueDate: '',
      dueTime: '',
      labelIds: [],
    });
  });

  it('điền sẵn từ việc có sẵn', () => {
    const task = makeTask({ title: 'A', dueAt: toDueAt('2026-10-20', '09:30'), labelIds: ['l1'] });
    expect(toFormValues(task)).toMatchObject({ title: 'A', dueDate: '2026-10-20', dueTime: '09:30', labelIds: ['l1'] });
  });

  it('báo lỗi tên rỗng và giờ khi chưa chọn ngày', () => {
    const result = validateTaskForm({ ...toFormValues(), title: '  ', dueTime: '09:00' });
    expect(result).toEqual({
      ok: false,
      errors: { title: 'Vui lòng nhập tên công việc', dueTime: 'Chọn ngày trước khi chọn giờ' },
    });
  });

  it('báo lỗi tên quá 200 ký tự', () => {
    const result = validateTaskForm({ ...toFormValues(), title: 'a'.repeat(201) });
    expect(result).toEqual({ ok: false, errors: { title: 'Tên tối đa 200 ký tự' } });
  });

  it('hợp lệ thì trả về dữ liệu đã chuẩn hoá', () => {
    const result = validateTaskForm({
      ...toFormValues(),
      title: '  Viết báo cáo ',
      description: ' chi tiết ',
      priority: 'high',
      dueDate: '2026-10-20',
    });
    expect(result).toEqual({
      ok: true,
      input: {
        title: 'Viết báo cáo',
        description: 'chi tiết',
        status: 'todo',
        priority: 'high',
        dueAt: toDueAt('2026-10-20', ''),
        labelIds: [],
      },
    });
  });
});
