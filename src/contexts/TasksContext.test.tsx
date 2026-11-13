import { act, render, waitFor } from '@testing-library/react';
import { StrictMode, useEffect } from 'react';
import { beforeEach, expect, it, vi } from 'vitest';

import { loadTasks, saveTasks } from '../services/taskStorage';
import type { Task, TaskDraft } from '../types/task';

import { TasksProvider } from './TasksProvider';
import { useTasks } from './useTasks';

vi.mock('../services/taskStorage', () => ({ loadTasks: vi.fn(), saveTasks: vi.fn() }));
const draft: TaskDraft = { title: 'Nova tarefa', description: '', category: 'work', priority: 'high' };
const saved: Task = {
  ...draft,
  id: 'saved',
  title: 'Tarefa existente',
  completed: false,
  createdAt: '2026-11-13T10:00:00Z',
  updatedAt: '2026-11-13T10:00:00Z',
};
let context: ReturnType<typeof useTasks>;
function Consumer() {
  const value = useTasks();
  useEffect(() => {
    context = value;
  }, [value]);
  return <span>{value.tasks.length}</span>;
}
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(saveTasks).mockResolvedValue();
});

it('waits for asynchronous hydration in StrictMode and never overwrites saved tasks', async () => {
  let resolveLoad!: (tasks: Task[]) => void;
  vi.mocked(loadTasks).mockImplementation(
    () =>
      new Promise((resolve) => {
        resolveLoad = resolve;
      }),
  );
  render(
    <StrictMode>
      <TasksProvider>
        <Consumer />
      </TasksProvider>
    </StrictMode>,
  );
  expect(context.ready).toBe(false);
  await expect(context.addTask(draft)).rejects.toThrow();
  expect(saveTasks).not.toHaveBeenCalled();
  await act(async () => {
    resolveLoad([saved]);
  });
  expect(context.ready).toBe(true);
  expect(context.tasks).toEqual([saved]);
  expect(saveTasks).not.toHaveBeenCalled();
});

it('serializes concurrent changes, rolls back failed writes and allows retry', async () => {
  vi.mocked(loadTasks).mockResolvedValue([saved]);
  render(
    <TasksProvider>
      <Consumer />
    </TasksProvider>,
  );
  await waitFor(() => expect(context.ready).toBe(true));
  await act(async () => {
    await Promise.all([context.addTask(draft), context.toggleTask('saved')]);
  });
  expect(context.tasks).toHaveLength(2);
  expect(context.tasks.find((task) => task.id === 'saved')?.completed).toBe(true);
  expect(vi.mocked(saveTasks).mock.calls[1][0]).toHaveLength(2);
  vi.mocked(saveTasks).mockRejectedValueOnce(new Error('write failure'));
  await act(async () => {
    await expect(context.deleteTask('saved')).rejects.toThrow();
  });
  expect(context.tasks).toHaveLength(2);
  await act(async () => {
    await context.deleteTask('saved');
  });
  expect(context.tasks).toHaveLength(1);
});

it('blocks edits on read failure and can recover by retrying', async () => {
  vi.mocked(loadTasks).mockRejectedValueOnce(new Error('read failure')).mockResolvedValue([saved]);
  render(
    <TasksProvider>
      <Consumer />
    </TasksProvider>,
  );
  await waitFor(() => expect(context.loadError).toBe(true));
  expect(context.ready).toBe(false);
  expect(saveTasks).not.toHaveBeenCalled();
  act(() => context.retryLoad());
  await waitFor(() => expect(context.ready).toBe(true));
  expect(context.tasks).toEqual([saved]);
});
