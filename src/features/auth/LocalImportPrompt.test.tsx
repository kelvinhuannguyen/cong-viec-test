import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { makeLabel, makeTask } from '../../test/factories';
import { createTestRepositories, createWrapper } from '../../test/render';
import { LocalImportPrompt, localImportKey } from './LocalImportPrompt';

const label = makeLabel({ id: 'l-cu', name: 'Công việc' });
const snapshot = {
  labels: [label],
  tasks: [makeTask({ id: 't-1', title: 'Việc cũ 1', labelIds: ['l-cu'] }), makeTask({ id: 't-2', title: 'Việc cũ 2' })],
};

describe('LocalImportPrompt', () => {
  it('đưa dữ liệu trên máy lên tài khoản với id mới, rồi không hỏi lại', async () => {
    const user = userEvent.setup();
    const repos = createTestRepositories();
    const Wrapper = createWrapper(repos);
    render(
      <Wrapper>
        <LocalImportPrompt userId="u-1" readLocal={async () => snapshot} />
      </Wrapper>,
    );
    expect(await screen.findByRole('dialog', { name: 'Đưa dữ liệu lên tài khoản' })).toHaveTextContent('2 việc');
    await user.click(screen.getByRole('button', { name: 'Đưa lên' }));

    await waitFor(async () => expect(await repos.tasks.list()).toHaveLength(2));
    const [labels, tasks] = await Promise.all([repos.labels.list(), repos.tasks.list()]);
    expect(labels).toHaveLength(1);
    expect(labels[0].id).not.toBe('l-cu');
    expect(tasks.map((t) => t.id)).not.toContain('t-1');
    expect(tasks.find((t) => t.title === 'Việc cũ 1')?.labelIds).toEqual([labels[0].id]);
    expect(await screen.findByText('Đã đưa 2 việc lên tài khoản')).toBeInTheDocument();
    expect(localStorage.getItem(localImportKey('u-1'))).toBe('"done"');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('Bỏ qua thì không đưa gì lên và không hỏi lại', async () => {
    const user = userEvent.setup();
    const repos = createTestRepositories();
    const Wrapper = createWrapper(repos);
    render(
      <Wrapper>
        <LocalImportPrompt userId="u-2" readLocal={async () => snapshot} />
      </Wrapper>,
    );
    await user.click(await screen.findByRole('button', { name: 'Bỏ qua' }));
    expect(localStorage.getItem(localImportKey('u-2'))).toBe('"skipped"');
    expect(await repos.tasks.list()).toEqual([]);
  });

  it('máy không có dữ liệu cũ thì không hiện gì', async () => {
    const repos = createTestRepositories();
    const Wrapper = createWrapper(repos);
    let read = false;
    render(
      <Wrapper>
        <LocalImportPrompt
          userId="u-3"
          readLocal={async () => {
            read = true;
            return { tasks: [], labels: [] };
          }}
        />
      </Wrapper>,
    );
    await waitFor(() => expect(read).toBe(true));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
