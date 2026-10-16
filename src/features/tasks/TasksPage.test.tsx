import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { Repositories } from '../../data/repository';
import { createTestRepositories, renderApp, withTasks } from '../../test/render';

async function seed(repos: Repositories) {
  await repos.tasks.create({ title: 'Viết báo cáo quý', priority: 'low' });
  await repos.tasks.create({ title: 'Mua sữa', status: 'in_progress', priority: 'high' });
  await repos.tasks.create({ title: 'Gọi điện cho mẹ', priority: 'medium' });
}

function rowTitles(): string[] {
  const list = screen.getByRole('list', { name: 'Danh sách công việc' });
  return within(list)
    .getAllByRole('listitem')
    .map((li) => within(li).getAllByRole('button')[0].textContent ?? '');
}

describe('trang Công việc', () => {
  it('đọc dữ liệu lỗi thì báo lỗi, không hiện trạng thái trống', async () => {
    renderApp(withTasks(createTestRepositories(), { list: () => Promise.reject(new Error('boom')) }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Không đọc được dữ liệu. Hãy tải lại trang.');
    expect(screen.getByRole('button', { name: 'Tải lại' })).toBeInTheDocument();
    expect(screen.queryByText('Chưa có công việc nào')).not.toBeInTheDocument();
  });

  it('đọc lại ngầm bị lỗi thì vẫn giữ danh sách đã tải, không báo lỗi', async () => {
    const user = userEvent.setup();
    const base = createTestRepositories();
    await base.tasks.create({ title: 'Mua sữa' });
    let calls = 0;
    const repos = withTasks(base, {
      list: () => (++calls === 1 ? base.tasks.list() : Promise.reject(new Error('boom'))),
    });
    renderApp(repos);
    expect(await screen.findByRole('button', { name: 'Mua sữa' })).toBeInTheDocument();
    // Thêm việc làm danh sách được đọc lại, lần đọc này lỗi.
    await user.type(screen.getByLabelText('Thêm nhanh công việc'), 'Gọi điện{Enter}');
    await waitFor(() => expect(calls).toBe(2));
    expect(screen.getByRole('button', { name: 'Mua sữa' })).toBeInTheDocument();
    expect(screen.queryByText('Không đọc được dữ liệu. Hãy tải lại trang.')).not.toBeInTheDocument();
  });

  it('thêm nhanh thất bại thì giữ nguyên chữ đã gõ', async () => {
    const user = userEvent.setup();
    renderApp(withTasks(createTestRepositories(), { create: () => Promise.reject(new Error('boom')) }));
    const input = await screen.findByLabelText('Thêm nhanh công việc');
    await user.type(input, 'Việc hỏng{Enter}');
    await waitFor(() => expect(input).toHaveValue('Việc hỏng'));
  });

  it('lọc theo trạng thái, có đếm số và ghi lên URL', async () => {
    const user = userEvent.setup();
    const repos = createTestRepositories();
    await seed(repos);
    renderApp(repos);
    const filters = await screen.findByRole('group', { name: 'Lọc theo trạng thái' });
    await waitFor(() => expect(within(filters).getByRole('button', { name: 'Tất cả 3' })).toBeInTheDocument());
    await user.click(within(filters).getByRole('button', { name: 'Đang làm 1' }));
    expect(rowTitles()).toEqual(['Mua sữa']);
    expect(screen.getByTestId('location')).toHaveTextContent('/?status=in_progress');
  });

  it('tìm kiếm không dấu', async () => {
    const user = userEvent.setup();
    const repos = createTestRepositories();
    await seed(repos);
    renderApp(repos);
    await screen.findByRole('button', { name: 'Mua sữa' });
    await user.type(screen.getByLabelText('Tìm công việc'), 'bao cao');
    await waitFor(() => expect(rowTitles()).toEqual(['Viết báo cáo quý']));
  });

  it('đọc từ khoá và kiểu sắp xếp từ URL', async () => {
    const repos = createTestRepositories();
    await seed(repos);
    renderApp(repos, '/?q=sua');
    expect(await screen.findByRole('button', { name: 'Mua sữa' })).toBeInTheDocument();
    expect(screen.getByLabelText('Tìm công việc')).toHaveValue('sua');
    expect(rowTitles()).toEqual(['Mua sữa']);
  });

  it('sắp xếp theo ưu tiên', async () => {
    const user = userEvent.setup();
    const repos = createTestRepositories();
    await seed(repos);
    renderApp(repos);
    await screen.findByRole('button', { name: 'Mua sữa' });
    await user.selectOptions(screen.getByLabelText('Sắp xếp'), 'priority');
    expect(rowTitles()).toEqual(['Mua sữa', 'Gọi điện cho mẹ', 'Viết báo cáo quý']);
  });

  it('tích ô để đánh dấu Đã xong; menu đổi trạng thái', async () => {
    const user = userEvent.setup();
    const repos = createTestRepositories();
    await seed(repos);
    renderApp(repos);
    await user.click(await screen.findByLabelText('Đánh dấu "Mua sữa" đã xong'));
    await waitFor(() => expect(screen.getByLabelText('Trạng thái của "Mua sữa"')).toHaveValue('done'));
    await user.selectOptions(screen.getByLabelText('Trạng thái của "Gọi điện cho mẹ"'), 'on_hold');
    await waitFor(async () => {
      const saved = await repos.tasks.list();
      expect(saved.find((t) => t.title === 'Mua sữa')?.status).toBe('done');
      expect(saved.find((t) => t.title === 'Gọi điện cho mẹ')?.status).toBe('on_hold');
    });
  });

  it('xoá qua menu ⋯ rồi hoàn tác', async () => {
    const user = userEvent.setup();
    const repos = createTestRepositories();
    await seed(repos);
    renderApp(repos);
    await user.click(await screen.findByRole('button', { name: 'Thao tác khác cho "Mua sữa"' }));
    await user.click(screen.getByRole('menuitem', { name: 'Xoá' }));
    expect(await screen.findByText('Đã xoá "Mua sữa"')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Mua sữa' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Hoàn tác' }));
    expect(await screen.findByRole('button', { name: 'Mua sữa' })).toBeInTheDocument();
  });

  it('trạng thái trống và phím N', async () => {
    const user = userEvent.setup();
    renderApp(createTestRepositories());
    expect(await screen.findByText('Chưa có công việc nào')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Thêm việc đầu tiên' }));
    expect(screen.getByRole('dialog', { name: 'Thêm công việc' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    await user.keyboard('n');
    expect(screen.getByRole('dialog', { name: 'Thêm công việc' })).toBeInTheDocument();
  });

  it('lọc không ra kết quả thì có nút Xoá bộ lọc', async () => {
    const user = userEvent.setup();
    const repos = createTestRepositories();
    await seed(repos);
    renderApp(repos, '/?status=done&q=abc');
    await user.click(await screen.findByRole('button', { name: 'Xoá bộ lọc' }));
    await waitFor(() => expect(rowTitles()).toHaveLength(3));
    expect(screen.getByLabelText('Tìm công việc')).toHaveValue('');
    expect(screen.getByTestId('location')).toHaveTextContent(/^\/$/);
  });

  it('ô tìm kiếm đồng bộ với URL khi điều hướng bằng liên kết', async () => {
    const user = userEvent.setup();
    const repos = createTestRepositories();
    await seed(repos);
    renderApp(repos, '/?q=abc');
    expect(await screen.findByLabelText('Tìm công việc')).toHaveValue('abc');
    const nav = screen.getByRole('navigation', { name: 'Điều hướng chính' });
    await user.click(within(nav).getByRole('link', { name: /Công việc/ }));
    await waitFor(() => expect(rowTitles()).toHaveLength(3));
    expect(screen.getByLabelText('Tìm công việc')).toHaveValue('');
  });
});
