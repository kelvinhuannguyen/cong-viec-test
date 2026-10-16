import { MutationObserver, type QueryClient } from '@tanstack/react-query';
import { waitFor } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { labelKeys, taskKeys } from '../hooks/queryKeys';
import { connectCrossTabSync } from './crossTabSync';
import { createQueryClient } from './queryClient';

const disconnects: (() => void)[] = [];
afterEach(() => disconnects.splice(0).forEach((fn) => fn()));

function tab(channel: string): QueryClient {
  const client = createQueryClient();
  client.setQueryData(taskKeys.all, []);
  client.setQueryData(labelKeys.all, []);
  disconnects.push(connectCrossTabSync(client, channel));
  return client;
}

const invalidated = (client: QueryClient, key: readonly unknown[]) => client.getQueryState(key)?.isInvalidated;

function runMutation(client: QueryClient, fail = false) {
  const observer = new MutationObserver(client, {
    mutationFn: () => (fail ? Promise.reject(new Error('boom')) : Promise.resolve('ok')),
  });
  return observer.mutate().catch(() => undefined);
}

it('ghi ở một tab thì các tab khác đọc lại việc và nhãn', async () => {
  const channel = `test-${crypto.randomUUID()}`;
  const a = tab(channel);
  const b = tab(channel);
  await runMutation(a);
  await waitFor(() => expect(invalidated(b, taskKeys.all)).toBe(true));
  expect(invalidated(b, labelKeys.all)).toBe(true);
  expect(invalidated(a, taskKeys.all)).toBe(false);
});

it('ghi lỗi vẫn báo, vì có thể đã ghi được một phần', async () => {
  const channel = `test-${crypto.randomUUID()}`;
  const a = tab(channel);
  const b = tab(channel);
  await runMutation(a, true);
  await waitFor(() => expect(invalidated(b, taskKeys.all)).toBe(true));
});

it('ngắt kết nối thì không nhận nữa', async () => {
  const channel = `test-${crypto.randomUUID()}`;
  const a = tab(channel);
  const b = createQueryClient();
  b.setQueryData(taskKeys.all, []);
  connectCrossTabSync(b, channel)();
  // Một tab thứ ba vẫn kết nối để biết chắc tin nhắn đã được gửi đi.
  const c = tab(channel);
  await runMutation(a);
  await waitFor(() => expect(invalidated(c, taskKeys.all)).toBe(true));
  expect(invalidated(b, taskKeys.all)).toBe(false);
});
