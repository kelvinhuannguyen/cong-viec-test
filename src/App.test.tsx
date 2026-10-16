import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { App } from './App';

it('mở ứng dụng vào trang Công việc', async () => {
  render(<App />);
  expect(await screen.findByRole('heading', { level: 1, name: 'Công việc' })).toBeInTheDocument();
});
