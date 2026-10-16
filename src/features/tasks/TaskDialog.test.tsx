import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { toDueAt } from '../../domain/rules';
import { createTestRepositories, renderApp } from '../../test/render';

describe('tạo / sửa công việc', () => {
  it('thêm nhanh bằng Enter', async () => {
    const user = userEvent.setup();
    const repos = createTestRepositories();
    renderApp(repos);
    await user.type(await screen.findByLabelText('Thêm nhanh công việc'), 'Mua sữa{Enter}');
    expect(await screen.findByRole('button', { name: 'Mua sữa' })).toBeInTheDocument();
    expect(screen.getByLabelText('Thêm nhanh công việc')).toHaveValue('');
    expect((await repos.tasks.list()).map((t) => t.title)).toEqual(['Mua sữa']);
  });

  it('tạo qua hộp thoại, có kiểm tra lỗi', async () => {
    const user = userEvent.setup();
    const repos = createTestRepositories();
    renderApp(repos);
    await user.click(await screen.findByRole('button', { name: '+ Thêm' }));
    const dialog = screen.getByRole('dialog', { name: 'Thêm công việc' });

    await user.click(within(dialog).getByRole('button', { name: 'Thêm' }));
    expect(within(dialog).getByText('Vui lòng nhập tên công việc')).toBeInTheDocument();

    await user.type(within(dialog).getByLabelText('Tên công việc'), 'Viết báo cáo quý');
    await user.selectOptions(within(dialog).getByLabelText('Ưu tiên'), 'high');
    fireEvent.change(within(dialog).getByLabelText('Hạn chót'), { target: { value: '2026-10-20' } });
    await user.click(within(dialog).getByRole('button', { name: 'Thêm' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    const [saved] = await repos.tasks.list();
    expect(saved).toMatchObject({ title: 'Viết báo cáo quý', priority: 'high', dueAt: toDueAt('2026-10-20', '') });
  });

  it('mở ?task=<id> để sửa', async () => {
    const user = userEvent.setup();
    const repos = createTestRepositories();
    const task = await repos.tasks.create({ title: 'Cũ' });
    renderApp(repos, `/?task=${task.id}`);
    const dialog = await screen.findByRole('dialog', { name: 'Sửa công việc' });
    const title = within(dialog).getByLabelText('Tên công việc');
    expect(title).toHaveValue('Cũ');
    await user.clear(title);
    await user.type(title, 'Mới');
    await user.click(within(dialog).getByRole('button', { name: 'Lưu' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect((await repos.tasks.list())[0].title).toBe('Mới');
    expect(screen.getByTestId('location')).toHaveTextContent(/^\/$/);
  });

  it('?task=<id> không tồn tại thì tự đóng', async () => {
    renderApp(createTestRepositories(), '/?task=khong-co');
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent(/^\/$/));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('Escape đóng hộp thoại', async () => {
    const user = userEvent.setup();
    renderApp(createTestRepositories());
    await user.click(await screen.findByRole('button', { name: '+ Thêm' }));
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
