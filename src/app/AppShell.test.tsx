import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { createTestRepositories, renderApp } from '../test/render';
import { ErrorBoundary } from './ErrorBoundary';
import { StorageGate } from './StorageGate';

describe('khung ứng dụng', () => {
  it('điều hướng giữa các trang', async () => {
    const user = userEvent.setup();
    renderApp(createTestRepositories());
    expect(await screen.findByRole('heading', { level: 1, name: 'Công việc' })).toBeInTheDocument();
    const nav = screen.getByRole('navigation', { name: 'Điều hướng chính' });
    await user.click(within(nav).getByRole('link', { name: 'Báo cáo' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Báo cáo' })).toBeInTheDocument();
    await user.click(within(nav).getByRole('link', { name: 'Cài đặt' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Cài đặt' })).toBeInTheDocument();
  });

  it('đường dẫn lạ quay về trang Công việc', async () => {
    renderApp(createTestRepositories(), '/khong-co');
    expect(await screen.findByRole('heading', { level: 1, name: 'Công việc' })).toBeInTheDocument();
  });
});

describe('StorageGate', () => {
  it('IndexedDB không dùng được thì hiện giải thích', async () => {
    render(<StorageGate probe={async () => false}>{() => <p>ok</p>}</StorageGate>);
    expect(await screen.findByRole('alert')).toHaveTextContent('Không thể lưu dữ liệu');
    expect(screen.queryByText('ok')).not.toBeInTheDocument();
  });
  it('dùng được thì render nội dung với repositories', async () => {
    const repos = createTestRepositories();
    render(
      <StorageGate probe={async () => true} createRepositories={() => repos}>
        {(r) => <p>{r === repos ? 'ok' : 'sai'}</p>}
      </StorageGate>,
    );
    expect(await screen.findByText('ok')).toBeInTheDocument();
  });
});

describe('ErrorBoundary', () => {
  it('lỗi ngoài dự kiến thì hiện màn hình lỗi', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    function Boom(): never {
      throw new Error('boom');
    }
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Đã có lỗi');
    expect(screen.getByRole('button', { name: 'Tải lại' })).toBeInTheDocument();
  });
});
