import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { UpdatePrompt } from './UpdatePrompt';

const { updateServiceWorker, setNeedRefresh } = vi.hoisted(() => ({
  updateServiceWorker: vi.fn(async (_reload?: boolean) => {}),
  setNeedRefresh: vi.fn(),
}));

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({
    needRefresh: [true, setNeedRefresh],
    offlineReady: [false, vi.fn()],
    updateServiceWorker,
  }),
}));

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
