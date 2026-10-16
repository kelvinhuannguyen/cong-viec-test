import { act, renderHook, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Repositories } from '../data/repository';
import type { TaskUpdate } from '../domain/task';
import { SAVE_ERROR } from '../lib/errors';
import { createTestRepositories, createWrapper, withTasks } from '../test/render';
import { useDeleteLabel, useLabels } from './useLabels';
import { useCreateTask, useDeleteTask, useTasks, useUpdateTasks } from './useTasks';

function withFailingUpdate(repos: Repositories): Repositories {
  const fail = () => Promise.reject(new Error('boom'));
  return withTasks(repos, { update: fail, updateMany: fail });
}

describe('task hooks', () => {
  it('useCreateTask thêm việc và danh sách tự cập nhật', async () => {
    const repos = createTestRepositories();
    const { result } = renderHook(() => ({ list: useTasks(), create: useCreateTask() }), {
      wrapper: createWrapper(repos),
    });
    await waitFor(() => expect(result.current.list.isSuccess).toBe(true));
    await act(() => result.current.create.mutateAsync({ title: 'Mua sữa' }));
    await waitFor(() => expect(result.current.list.data?.map((t) => t.title)).toEqual(['Mua sữa']));
  });

  it('useUpdateTasks cập nhật lạc quan rồi lưu xuống kho', async () => {
    const repos = createTestRepositories();
    const task = await repos.tasks.create({ title: 'A' });
    const { result } = renderHook(() => ({ list: useTasks(), update: useUpdateTasks() }), {
      wrapper: createWrapper(repos),
    });
    await waitFor(() => expect(result.current.list.data).toHaveLength(1));
    act(() => result.current.update.mutate([{ id: task.id, patch: { status: 'done' } }]));
    await waitFor(() => expect(result.current.list.data?.[0].status).toBe('done'));
    const [saved] = await repos.tasks.list();
    expect(saved.status).toBe('done');
    expect(saved.completedAt).not.toBeNull();
  });

  it('useUpdateTasks lưu nhiều việc bằng một lần updateMany', async () => {
    const base = createTestRepositories();
    const a = await base.tasks.create({ title: 'A' });
    const b = await base.tasks.create({ title: 'B' });
    const updateMany = vi.fn((updates: TaskUpdate[]) => base.tasks.updateMany(updates));
    const update = vi.fn();
    const repos = withTasks(base, { updateMany, update });
    const { result } = renderHook(() => ({ list: useTasks(), update: useUpdateTasks() }), {
      wrapper: createWrapper(repos),
    });
    await waitFor(() => expect(result.current.list.data).toHaveLength(2));
    const updates = [
      { id: a.id, patch: { position: 5 } },
      { id: b.id, patch: { position: 6 } },
    ];
    await act(() => result.current.update.mutateAsync(updates));
    expect(updateMany).toHaveBeenCalledTimes(1);
    expect(updateMany).toHaveBeenCalledWith(updates);
    expect(update).not.toHaveBeenCalled();
  });

  it('lưu thất bại thì khôi phục và báo lỗi', async () => {
    const base = createTestRepositories();
    await base.tasks.create({ title: 'A' });
    const repos = withFailingUpdate(base);
    const { result } = renderHook(() => ({ list: useTasks(), update: useUpdateTasks() }), {
      wrapper: createWrapper(repos),
    });
    await waitFor(() => expect(result.current.list.data).toHaveLength(1));
    const id = result.current.list.data![0].id;
    act(() => result.current.update.mutate([{ id, patch: { status: 'done' } }]));
    expect(await screen.findByText(SAVE_ERROR)).toBeInTheDocument();
    await waitFor(() => expect(result.current.list.data?.[0].status).toBe('todo'));
  });

  it('useDeleteTask xoá và cho hoàn tác', async () => {
    const user = userEvent.setup();
    const repos = createTestRepositories();
    const task = await repos.tasks.create({ title: 'A' });
    const { result } = renderHook(() => ({ list: useTasks(), remove: useDeleteTask() }), {
      wrapper: createWrapper(repos),
    });
    await waitFor(() => expect(result.current.list.data).toHaveLength(1));
    act(() => result.current.remove.mutate(task));
    await waitFor(() => expect(result.current.list.data).toHaveLength(0));
    await user.click(await screen.findByRole('button', { name: 'Hoàn tác' }));
    await waitFor(() => expect(result.current.list.data).toEqual([task]));
  });
});

describe('label hooks', () => {
  it('xoá nhãn làm mới cả danh sách việc', async () => {
    const repos = createTestRepositories();
    const label = await repos.labels.create({ name: 'A', color: 'blue' });
    await repos.tasks.create({ title: 'T', labelIds: [label.id] });
    const { result } = renderHook(
      () => ({ tasks: useTasks(), labels: useLabels(), remove: useDeleteLabel() }),
      { wrapper: createWrapper(repos) },
    );
    await waitFor(() => expect(result.current.tasks.data?.[0].labelIds).toEqual([label.id]));
    await act(() => result.current.remove.mutateAsync(label.id));
    await waitFor(() => expect(result.current.tasks.data?.[0].labelIds).toEqual([]));
    expect(result.current.labels.data).toEqual([]);
  });
});
