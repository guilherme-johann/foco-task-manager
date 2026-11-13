import { Preferences } from '@capacitor/preferences';

import type { Task } from '../types/task';
import { isValidDate } from '../utils/date';

export const STORAGE_KEY = 'foco.tasks.v1';

function isTask(value: unknown): value is Task {
  if (!value || typeof value !== 'object') return false;
  const task = value as Record<string, unknown>;
  return (
    typeof task.id === 'string' &&
    !!task.id &&
    typeof task.title === 'string' &&
    !!task.title.trim() &&
    task.title.length <= 120 &&
    typeof task.description === 'string' &&
    task.description.length <= 2000 &&
    ['work', 'study', 'personal'].includes(String(task.category)) &&
    ['high', 'medium', 'low'].includes(String(task.priority)) &&
    typeof task.completed === 'boolean' &&
    typeof task.createdAt === 'string' &&
    !Number.isNaN(Date.parse(task.createdAt)) &&
    typeof task.updatedAt === 'string' &&
    !Number.isNaN(Date.parse(task.updatedAt)) &&
    (task.dueDate === undefined || isValidDate(task.dueDate))
  );
}

export async function loadTasks(): Promise<Task[]> {
  const { value } = await Preferences.get({ key: STORAGE_KEY });
  if (value === null) return [];
  const data: unknown = JSON.parse(value);
  if (
    !data ||
    typeof data !== 'object' ||
    !('version' in data) ||
    data.version !== 1 ||
    !('tasks' in data) ||
    !Array.isArray(data.tasks) ||
    !data.tasks.every(isTask) ||
    new Set(data.tasks.map((task) => task.id)).size !== data.tasks.length
  ) {
    throw new Error('Os dados salvos não estão em um formato válido.');
  }
  return data.tasks;
}

export async function saveTasks(tasks: Task[]): Promise<void> {
  await Preferences.set({ key: STORAGE_KEY, value: JSON.stringify({ version: 1, tasks }) });
}
