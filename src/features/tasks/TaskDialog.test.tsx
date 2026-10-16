import { act, fireEvent, render, renderHook, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router';
import { describe, expect, it } from 'vitest';
import { AppProviders } from '../../app/AppProviders';
import { AppRoutes } from '../../app/AppRoutes';
import { createQueryClient } from '../../app/queryClient';
import { toDueAt } from '../../domain/rules';
import { createTestRepositories, LocationProbe, renderApp } from '../../test/render';
import { useTaskDialogParam } from './useTaskDialogParam';

function BrowserBack() {
  const navigate = useNavigate();
  return (
    <button type="button" data-testid="browser-back" onClick={() => navigate(-1)}>
      Back
    </button>
  );
}

/** Như renderApp nhưng có nhiều mục lịch sử và một nút giả lập Back của trình duyệt. */
function renderWithHistory(entries: string[]) {
  render(
    <AppProviders repositories={createTestRepositories()} queryClient={createQueryClient()}>
      <MemoryRouter initialEntries={entries} initialIndex={entries.length - 1}>
        <AppRoutes />
        <LocationProbe />
        <BrowserBack />
      </MemoryRouter>
    </AppProviders>,
  );
  return { back: () => fireEvent.click(screen.getByTestId('browser-back')) };
}

const location = () => screen.getByTestId('location');

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

describe('hộp thoại và lịch sử trình duyệt', () => {
  it('Back đóng hộp thoại vừa mở thay vì rời trang', async () => {
    const user = userEvent.setup();
    const { back } = renderWithHistory(['/']);
    await user.click(await screen.findByRole('button', { name: '+ Thêm' }));
    expect(location()).toHaveTextContent('/?task=new');
    back();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(location()).toHaveTextContent(/^\/$/);
  });

  it('đóng bằng Esc thì lùi lại, không để lại mục lịch sử thừa', async () => {
    const user = userEvent.setup();
    const { back } = renderWithHistory(['/bao-cao', '/']);
    await user.click(await screen.findByRole('button', { name: '+ Thêm' }));
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(location()).toHaveTextContent(/^\/$/);
    back();
    expect(location()).toHaveTextContent(/^\/bao-cao$/);
  });

  it('đóng hai lần liền chỉ lùi một bước', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <MemoryRouter
        initialEntries={['/bao-cao', '/', { pathname: '/', search: '?task=new', state: { taskDialog: true } }]}
        initialIndex={2}
      >
        {children}
      </MemoryRouter>
    );
    const { result } = renderHook(() => ({ dialog: useTaskDialogParam(), location: useLocation() }), { wrapper });
    act(() => {
      result.current.dialog.close();
      result.current.dialog.close();
    });
    expect(result.current.location.pathname + result.current.location.search).toBe('/');
    expect(result.current.dialog.dialogTaskId).toBeNull();
  });

  it('mở việc khác khi đang mở thì chỉ thay URL, đóng vẫn lùi về trước hộp thoại', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <MemoryRouter initialEntries={['/bao-cao', '/']} initialIndex={1}>
        {children}
      </MemoryRouter>
    );
    const { result } = renderHook(() => ({ dialog: useTaskDialogParam(), location: useLocation() }), { wrapper });
    const url = () => result.current.location.pathname + result.current.location.search;
    act(() => result.current.dialog.openNew());
    act(() => result.current.dialog.openTask('t1'));
    expect(url()).toBe('/?task=t1');
    act(() => result.current.dialog.close());
    expect(url()).toBe('/');
  });
});
