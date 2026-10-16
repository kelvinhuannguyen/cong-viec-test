import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { createBackup } from '../../data/backup';
import type { Repositories } from '../../data/repository';
import { createTestRepositories, renderApp, withTasks } from '../../test/render';

function withTasksNeverLoading(repos: Repositories, mode: 'pending' | 'error'): Repositories {
  return withTasks(repos, {
    list: () => (mode === 'pending' ? new Promise(() => {}) : Promise.reject(new Error('boom'))),
  });
}

describe('trang Cài đặt', () => {
  it('vô hiệu hoá xuất/nhập khi danh sách việc chưa tải xong', async () => {
    renderApp(withTasksNeverLoading(createTestRepositories(), 'pending'), '/cai-dat');
    expect(await screen.findByRole('button', { name: 'Xuất dữ liệu' })).toBeDisabled();
    expect(screen.getByLabelText('Nhập dữ liệu')).toBeDisabled();
  });

  it('báo lỗi và khoá xuất/nhập khi không đọc được dữ liệu', async () => {
    renderApp(withTasksNeverLoading(createTestRepositories(), 'error'), '/cai-dat');
    expect(await screen.findByText('Không đọc được dữ liệu. Hãy tải lại trang.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Xuất dữ liệu' })).toBeDisabled();
    expect(screen.getByLabelText('Nhập dữ liệu')).toBeDisabled();
  });

  it('đọc lại ngầm bị lỗi thì vẫn dùng dữ liệu đã tải, không báo lỗi', async () => {
    const user = userEvent.setup();
    const base = createTestRepositories();
    const label = await base.labels.create({ name: 'Cá nhân', color: 'pink' });
    await base.tasks.create({ title: 'T', labelIds: [label.id] });
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    let calls = 0;
    const repos = withTasks(base, {
      list: () => (++calls === 1 ? base.tasks.list() : Promise.reject(new Error('boom'))),
    });
    renderApp(repos, '/cai-dat');
    expect(await screen.findByText('1 việc')).toBeInTheDocument();
    // Xoá nhãn làm danh sách việc được đọc lại, lần đọc này lỗi.
    await user.click(screen.getByRole('button', { name: 'Xoá nhãn Cá nhân' }));
    await waitFor(() => expect(calls).toBe(2));
    expect(screen.queryByText('Không đọc được dữ liệu. Hãy tải lại trang.')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Xuất dữ liệu' })).toBeEnabled();
  });

  it('thêm nhãn; trùng tên thì báo lỗi', async () => {
    const user = userEvent.setup();
    const repos = createTestRepositories();
    renderApp(repos, '/cai-dat');
    await user.type(await screen.findByLabelText('Tên nhãn mới'), 'Công việc');
    await user.selectOptions(screen.getByLabelText('Màu nhãn mới'), 'green');
    await user.click(screen.getByRole('button', { name: 'Thêm nhãn' }));
    expect(await screen.findByLabelText('Tên nhãn Công việc')).toHaveValue('Công việc');
    expect((await repos.labels.list())[0]).toMatchObject({ name: 'Công việc', color: 'green' });

    await user.type(screen.getByLabelText('Tên nhãn mới'), 'công VIỆC');
    await user.click(screen.getByRole('button', { name: 'Thêm nhãn' }));
    expect(await screen.findByText('Nhãn này đã tồn tại')).toBeInTheDocument();
  });

  it('xoá nhãn sau khi xác nhận và gỡ khỏi các việc', async () => {
    const user = userEvent.setup();
    const repos = createTestRepositories();
    const label = await repos.labels.create({ name: 'Cá nhân', color: 'pink' });
    await repos.tasks.create({ title: 'T', labelIds: [label.id] });
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderApp(repos, '/cai-dat');
    expect(await screen.findByText('1 việc')).toBeInTheDocument(); // chờ danh sách việc tải xong
    await user.click(screen.getByRole('button', { name: 'Xoá nhãn Cá nhân' }));
    expect(confirm).toHaveBeenCalledWith('Xoá nhãn "Cá nhân"? Nhãn sẽ bị gỡ khỏi 1 công việc.');
    await waitFor(async () => expect(await repos.labels.list()).toEqual([]));
    expect((await repos.tasks.list())[0].labelIds).toEqual([]);
  });

  it('chọn giao diện Tối', async () => {
    const user = userEvent.setup();
    renderApp(createTestRepositories(), '/cai-dat');
    await user.click(await screen.findByRole('radio', { name: 'Tối' }));
    await waitFor(() => expect(document.documentElement).toHaveClass('dark'));
    expect(localStorage.getItem('cvct.theme')).toBe('"dark"');
  });

  it('xuất dữ liệu ghi lại thời điểm sao lưu', async () => {
    const user = userEvent.setup();
    URL.createObjectURL = vi.fn(() => 'blob:test');
    URL.revokeObjectURL = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    renderApp(createTestRepositories(), '/cai-dat');
    expect(await screen.findByText('Chưa sao lưu lần nào.')).toBeInTheDocument();
    const exportButton = screen.getByRole('button', { name: 'Xuất dữ liệu' });
    await waitFor(() => expect(exportButton).toBeEnabled());
    await user.click(exportButton);
    expect(click).toHaveBeenCalled();
    expect(await screen.findByText(/^Lần sao lưu gần nhất:/)).toBeInTheDocument();
  });

  it('nhập file sai thì báo lỗi, file đúng thì gộp dữ liệu', async () => {
    const user = userEvent.setup();
    const repos = createTestRepositories();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderApp(repos, '/cai-dat');
    const input = await screen.findByLabelText('Nhập dữ liệu');
    await waitFor(() => expect(input).toBeEnabled()); // chờ dữ liệu tải xong

    await user.upload(input, new File(['{oops'], 'sai.json', { type: 'application/json' }));
    expect(await screen.findByText('File không phải JSON hợp lệ')).toBeInTheDocument();

    const source = createTestRepositories();
    await source.tasks.create({ title: 'Từ file sao lưu' });
    const json = JSON.stringify(createBackup(await source.tasks.list(), [], new Date()));
    await user.upload(input, new File([json], 'dung.json', { type: 'application/json' }));
    expect(await screen.findByText('Đã nhập dữ liệu')).toBeInTheDocument();
    expect((await repos.tasks.list()).map((t) => t.title)).toEqual(['Từ file sao lưu']);
  });
});
