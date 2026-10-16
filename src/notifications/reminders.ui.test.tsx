import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { createTestRepositories, renderApp } from '../test/render';

const created: { title: string; options?: NotificationOptions }[] = [];

function stubNotification(permission: NotificationPermission, answer: NotificationPermission = permission) {
  created.length = 0;
  class FakeNotification {
    static permission: NotificationPermission = permission;
    static requestPermission = vi.fn(async () => {
      FakeNotification.permission = answer;
      return answer;
    });
    onclick: (() => void) | null = null;
    constructor(title: string, options?: NotificationOptions) {
      created.push({ title, options });
    }
    close() {}
  }
  vi.stubGlobal('Notification', FakeNotification);
}

const minutesFromNow = (m: number) => new Date(Date.now() + m * 60_000).toISOString();

describe('nhắc hạn chót', () => {
  it('bật trong Cài đặt khi được cấp quyền', async () => {
    const user = userEvent.setup();
    stubNotification('default', 'granted');
    renderApp(createTestRepositories(), '/cai-dat');
    const toggle = await screen.findByRole('checkbox', { name: 'Nhắc hạn chót bằng thông báo' });
    await user.click(toggle);
    await waitFor(() => expect(toggle).toBeChecked());
    expect(localStorage.getItem('cvct.reminders')).toBe('true');
  });

  it('bị từ chối quyền thì tắt và giải thích', async () => {
    const user = userEvent.setup();
    stubNotification('default', 'denied');
    renderApp(createTestRepositories(), '/cai-dat');
    const toggle = await screen.findByRole('checkbox', { name: 'Nhắc hạn chót bằng thông báo' });
    await user.click(toggle);
    expect(await screen.findByText(/Bạn chưa cho phép thông báo/)).toBeInTheDocument();
    expect(toggle).not.toBeChecked();
  });

  it('đang bật và có quyền thì gửi thông báo khi việc sắp đến hạn', async () => {
    stubNotification('granted');
    localStorage.setItem('cvct.reminders', 'true');
    const repos = createTestRepositories();
    await repos.tasks.create({ title: 'Họp nhóm', dueAt: minutesFromNow(30) });
    renderApp(repos);
    await waitFor(() => expect(created.map((n) => n.title)).toContain('Sắp đến hạn'));
    expect(created.find((n) => n.title === 'Sắp đến hạn')?.options?.body).toBe('Họp nhóm');
  });

  it('không có thông báo thì hiện dải cảnh báo khi có việc trễ', async () => {
    const repos = createTestRepositories();
    await repos.tasks.create({ title: 'Nộp thuế', dueAt: minutesFromNow(-60) });
    renderApp(repos);
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Bạn có 1 việc trễ hạn.');
    expect(alert).toHaveTextContent('Trình duyệt này không hỗ trợ thông báo.');
  });
});
