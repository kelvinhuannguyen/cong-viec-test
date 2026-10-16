import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { App } from './App';

it('hiển thị tên ứng dụng', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: 'Công Việc Của Tôi' })).toBeInTheDocument();
});
