import { Preferences } from '@capacitor/preferences';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Task } from '../types/task';

import { loadTasks, saveTasks, STORAGE_KEY } from './taskStorage';

vi.mock('@capacitor/preferences', () => ({ Preferences: { get: vi.fn(), set: vi.fn() } }));
const task: Task = {
  id: 'saved',
  title: 'Persistir tarefa',
  description: '',
  category: 'personal',
  priority: 'medium',
  completed: false,
  createdAt: '2026-11-13T10:00:00Z',
  updatedAt: '2026-11-13T10:00:00Z',
};

beforeEach(() => {
  vi.resetAllMocks();
});
describe('Preferences persistence', () => {
  it('returns an empty list on first use without writing', async () => {
    vi.mocked(Preferences.get).mockResolvedValue({ value: null });
    expect(await loadTasks()).toEqual([]);
    expect(Preferences.set).not.toHaveBeenCalled();
  });
  it('saves a versioned document and restores it', async () => {
    vi.mocked(Preferences.set).mockResolvedValue();
    await saveTasks([task]);
    const value = JSON.stringify({ version: 1, tasks: [task] });
    expect(Preferences.set).toHaveBeenCalledWith({ key: STORAGE_KEY, value });
    vi.mocked(Preferences.get).mockResolvedValue({ value });
    expect(await loadTasks()).toEqual([task]);
  });
  it.each([
    '{broken',
    '{"version":2,"tasks":[]}',
    '{"version":1,"tasks":[{}]}',
    JSON.stringify({ version: 1, tasks: [task, task] }),
    JSON.stringify({ version: 1, tasks: [{ ...task, dueDate: '2026-02-30' }] }),
  ])('preserves invalid data instead of overwriting it (%s)', async (value) => {
    vi.mocked(Preferences.get).mockResolvedValue({ value });
    await expect(loadTasks()).rejects.toThrow();
    expect(Preferences.set).not.toHaveBeenCalled();
  });
  it('propagates read and write failures', async () => {
    vi.mocked(Preferences.get).mockRejectedValue(new Error('read failure'));
    await expect(loadTasks()).rejects.toThrow('read failure');
    vi.mocked(Preferences.set).mockRejectedValue(new Error('quota exceeded'));
    await expect(saveTasks([task])).rejects.toThrow('quota exceeded');
  });
});
