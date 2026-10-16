import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { createTestRepositories, renderApp } from '../../test/render';

const hoursFromNow = (h: number) => new Date(Date.now() + h * 3_600_000).toISOString();

describe('trang Báo cáo', () => {
  it('hiện số liệu tổng quan', async () => {
    const repos = createTestRepositories();
    await repos.tasks.create({ title: 'A' });
    await repos.tasks.create({ title: 'B', status: 'in_progress' });
    await repos.tasks.create({ title: 'C', status: 'done' });
    renderApp(repos, '/bao-cao');
    const card = (name: string) => screen.getByRole('group', { name });
    await waitFor(() => expect(card('Tổng')).toHaveTextContent('3'));
    expect(card('Đang làm')).toHaveTextContent('1');
    expect(card('Đã xong')).toHaveTextContent('1');
    expect(card('Tỉ lệ hoàn thành')).toHaveTextContent('33%');
  });

  it('liệt kê việc trễ hạn và sắp đến hạn; bấm để mở hộp thoại sửa', async () => {
    const user = userEvent.setup();
    const repos = createTestRepositories();
    await repos.tasks.create({ title: 'Nộp thuế', dueAt: hoursFromNow(-30) });
    await repos.tasks.create({ title: 'Họp nhóm', dueAt: hoursFromNow(5) });
    await repos.tasks.create({ title: 'Đi du lịch', dueAt: hoursFromNow(24 * 10) });
    renderApp(repos, '/bao-cao');

    const overdue = await screen.findByRole('region', { name: 'Trễ hạn (1)' });
    const soon = screen.getByRole('region', { name: 'Sắp đến hạn (1)' });
    expect(within(soon).getByRole('button', { name: /Họp nhóm/ })).toBeInTheDocument();
    expect(screen.queryByText('Đi du lịch')).not.toBeInTheDocument();

    await user.click(within(overdue).getByRole('button', { name: /Nộp thuế/ }));
    expect(await screen.findByRole('dialog', { name: 'Sửa công việc' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Báo cáo' })).toBeInTheDocument();
  });

  it('chuyển khoảng thời gian của biểu đồ cột', async () => {
    const user = userEvent.setup();
    renderApp(createTestRepositories(), '/bao-cao');
    const week = await screen.findByRole('button', { name: '8 tuần' });
    expect(screen.getByRole('button', { name: '7 ngày' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(week);
    expect(week).toHaveAttribute('aria-pressed', 'true');
  });
});
