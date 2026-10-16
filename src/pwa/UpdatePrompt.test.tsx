import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { RegisterSWOptions } from 'vite-plugin-pwa/types';
import { afterEach, expect, it, vi } from 'vitest';
import { SW_UPDATE_INTERVAL_MS, UpdatePrompt } from './UpdatePrompt';

const { updateServiceWorker, setNeedRefresh, registered } = vi.hoisted(() => ({
  updateServiceWorker: vi.fn(async (_reload?: boolean) => {}),
  setNeedRefresh: vi.fn(),
  registered: { options: undefined as RegisterSWOptions | undefined },
}));

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: (options?: RegisterSWOptions) => {
    registered.options = options;
    return {
      needRefresh: [true, setNeedRefresh],
      offlineReady: [false, vi.fn()],
      updateServiceWorker,
    };
  },
}));

afterEach(() => {
  vi.useRealTimers();
});

it('có bản mới thì hỏi tải lại, không tự tải', async () => {
  const user = userEvent.setup();
  render(<UpdatePrompt />);
  expect(screen.getByText('Có phiên bản mới.')).toBeInTheDocument();
  expect(updateServiceWorker).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: 'Tải lại' }));
  expect(updateServiceWorker).toHaveBeenCalledWith(true);
  await user.click(screen.getByRole('button', { name: 'Để sau' }));
  expect(setNeedRefresh).toHaveBeenCalledWith(false);
});

it('kiểm tra bản mới mỗi giờ, bỏ qua khi mất mạng', () => {
  vi.useFakeTimers();
  render(<UpdatePrompt />);
  const update = vi.fn(() => Promise.resolve());
  const registration = { installing: null, update } as unknown as ServiceWorkerRegistration;
  registered.options?.onRegisteredSW?.('/sw.js', registration);

  vi.advanceTimersByTime(SW_UPDATE_INTERVAL_MS - 1);
  expect(update).not.toHaveBeenCalled();
  vi.advanceTimersByTime(1);
  expect(update).toHaveBeenCalledTimes(1);

  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
  vi.advanceTimersByTime(SW_UPDATE_INTERVAL_MS);
  expect(update).toHaveBeenCalledTimes(1);
  vi.clearAllTimers();
});
