import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { Repositories } from '../../data/repository';
import { createTestRepositories, renderApp } from '../../test/render';

async function seed(repos: Repositories) {
  await repos.tasks.create({ title: 'Viết báo cáo quý' });
  await repos.tasks.create({ title: 'Mua sữa', status: 'in_progress' });
  await repos.tasks.create({ title: 'Gọi điện cho mẹ', status: 'done' });
}

const columnTitles = () => screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);

describe('Kanban', () => {
  it('chuyển sang Kanban, hiện 4 cột đúng thứ tự và nhớ lựa chọn', async () => {
    const user = userEvent.setup();
    const repos = createTestRepositories();
    await seed(repos);
    renderApp(repos);
    await screen.findByRole('button', { name: 'Mua sữa' });
    await user.click(screen.getByRole('button', { name: 'Kanban' }));
    expect(columnTitles()).toEqual(['Cần làm', 'Đang làm', 'Tạm hoãn', 'Đã xong']);
    const doing = screen.getByRole('region', { name: 'Đang làm' });
    expect(within(doing).getByRole('button', { name: 'Mua sữa' })).toBeInTheDocument();
    expect(localStorage.getItem('cvct.view')).toBe('"kanban"');
    expect(screen.queryByLabelText('Sắp xếp')).not.toBeInTheDocument();
  });

  it('bộ lọc trạng thái ẩn các cột khác; tìm kiếm lọc thẻ', async () => {
    const user = userEvent.setup();
    localStorage.setItem('cvct.view', '"kanban"');
    const repos = createTestRepositories();
    await seed(repos);
    renderApp(repos, '/?status=done');
    await screen.findByRole('button', { name: 'Gọi điện cho mẹ' });
    expect(columnTitles()).toEqual(['Đã xong']);
    await user.click(screen.getByRole('button', { name: /^Tất cả/ }));
    await user.type(screen.getByLabelText('Tìm công việc'), 'sua');
    expect(await screen.findByRole('button', { name: 'Mua sữa' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Viết báo cáo quý' })).not.toBeInTheDocument();
  });
});
