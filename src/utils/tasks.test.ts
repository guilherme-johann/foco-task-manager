import { describe, expect, it, vi } from 'vitest';

import { taskReducer } from '../contexts/taskReducer';
import type { Task, TaskDraft, TaskFilters } from '../types/task';

import { getLocalDate, isValidDate, formatDueDate } from './date';
import { cleanDraft, createTask, filterTasks, getListCounts, matchesList, sortTasks, validateDraft } from './tasks';

const draft: TaskDraft = {
  title: 'Revisar apresentação',
  description: 'Estudar React e persistência',
  category: 'study',
  priority: 'high',
  dueDate: '2026-11-13',
};
const task: Task = {
  ...draft,
  id: 'a',
  completed: false,
  createdAt: '2026-11-01T10:00:00.000Z',
  updatedAt: '2026-11-01T10:00:00.000Z',
};
const defaults: TaskFilters = { query: '', category: 'all', priority: 'all', status: 'all' };

describe('task operations', () => {
  it('can create IDs when randomUUID is unavailable during HTTP live reload', () => {
    const getRandomValues = crypto.getRandomValues.bind(crypto);
    vi.stubGlobal('crypto', { getRandomValues });
    try {
      const first = createTask(draft);
      expect(first.id).toMatch(/^[a-f0-9]{32}$/);
      expect(first.id).not.toBe(createTask(draft).id);
    } finally {
      vi.unstubAllGlobals();
    }
  });
  it('creates a task with unique identity and cleaned values', () => {
    const result = createTask({ ...draft, title: '  Ler  ', description: '  Anotações  ', dueDate: '' });
    expect(result).toMatchObject({ title: 'Ler', description: 'Anotações', completed: false, dueDate: undefined });
    expect(result.id).not.toBe(createTask(draft).id);
    expect(Date.parse(result.createdAt)).not.toBeNaN();
  });
  it('adds, edits, completes, reopens and deletes without changing the original', () => {
    const original: Task[] = [];
    const added = taskReducer(original, { type: 'add', task });
    const updated = taskReducer(added, {
      type: 'update',
      id: task.id,
      draft: { ...draft, title: 'Novo título', dueDate: undefined },
      updatedAt: '2026-11-02T10:00:00Z',
    });
    expect(updated[0]).toMatchObject({ title: 'Novo título', id: 'a', createdAt: task.createdAt, dueDate: undefined });
    const completed = taskReducer(updated, { type: 'toggle', id: 'a', updatedAt: task.updatedAt });
    expect(completed[0].completed).toBe(true);
    expect(taskReducer(completed, { type: 'toggle', id: 'a', updatedAt: task.updatedAt })[0].completed).toBe(false);
    expect(taskReducer(completed, { type: 'delete', id: 'a' })).toEqual([]);
    expect(original).toEqual([]);
    expect(added[0].title).toBe(task.title);
  });
  it('restores saved tasks', () => {
    expect(taskReducer([], { type: 'load', tasks: [task] })).toEqual([task]);
  });
  it('rejects empty titles, invalid dates, categories and oversized values', () => {
    expect(validateDraft({ ...draft, title: '   ' })).toBeTruthy();
    expect(() => cleanDraft({ ...draft, title: '' })).toThrow();
    expect(validateDraft({ ...draft, title: 'a'.repeat(121) })).toBeTruthy();
    expect(validateDraft({ ...draft, description: 'a'.repeat(2001) })).toBeTruthy();
    expect(validateDraft({ ...draft, dueDate: '2026-02-30' })).toBeTruthy();
    expect(validateDraft({ ...draft, category: 'invalid' as TaskDraft['category'] })).toBeTruthy();
    expect(validateDraft({ ...draft, priority: 'invalid' as TaskDraft['priority'] })).toBeTruthy();
    expect(validateDraft({ ...draft, dueDate: undefined })).toBeNull();
  });
});

describe('combined search, filters and smart lists', () => {
  const tasks: Task[] = [
    task,
    { ...task, id: 'b', title: 'Comprar café', category: 'personal', priority: 'low', dueDate: undefined },
    { ...task, id: 'c', completed: true },
    { ...task, id: 'd', dueDate: '2026-11-12' },
    { ...task, id: 'e', dueDate: '2026-11-14', priority: 'medium' },
  ];
  it('searches title and description ignoring accents, case and outer whitespace', () => {
    expect(filterTasks(tasks, { ...defaults, query: '  CAFE ' }).map((item) => item.id)).toEqual(['b']);
    expect(filterTasks(tasks, { ...defaults, query: 'PERSISTENCIA' })).toHaveLength(5);
  });
  it('combines every filter with the search', () => {
    expect(
      filterTasks(tasks, { query: 'React', category: 'study', priority: 'high', status: 'pending' }).map(
        (item) => item.id,
      ),
    ).toEqual(['a', 'd']);
    expect(filterTasks(tasks, { ...defaults, status: 'completed' }).map((item) => item.id)).toEqual(['c']);
    expect(filterTasks(tasks, { ...defaults, category: 'work' })).toEqual([]);
  });
  it('counts today including overdue, planned, all, high priority and completed', () => {
    expect(getListCounts(tasks, '2026-11-13')).toEqual({ today: 2, planned: 3, all: 5, priority: 2, completed: 1 });
    expect(matchesList(tasks[2], 'today', '2026-11-13')).toBe(false);
    expect(matchesList(tasks[4], 'today', '2026-11-13')).toBe(false);
    expect(matchesList(tasks[2], 'completed')).toBe(true);
    expect(matchesList(tasks[1], 'planned')).toBe(false);
  });
  it('sorts by completion, due date, priority and creation without mutating', () => {
    const mixed = [{ ...task, id: 'low', priority: 'low' as const }, task, tasks[2], tasks[1], tasks[3]];
    expect(sortTasks(mixed).map((item) => item.id)).toEqual(['d', 'a', 'low', 'b', 'c']);
    expect(mixed[0].id).toBe('low');
  });
  it('updates counters when a task changes state', () => {
    const updated = taskReducer(tasks, { type: 'toggle', id: 'a', updatedAt: task.updatedAt });
    expect(getListCounts(updated, '2026-11-13')).toEqual({ today: 1, planned: 2, all: 5, priority: 1, completed: 2 });
  });
});

describe('local calendar dates', () => {
  it('uses local calendar fields and validates leap days', () => {
    expect(getLocalDate(new Date(2026, 10, 13, 23, 59))).toBe('2026-11-13');
    expect(isValidDate('2024-02-29')).toBe(true);
    expect(isValidDate('2026-02-29')).toBe(false);
    expect(isValidDate('2026-13-01')).toBe(false);
    expect(isValidDate('2026-1-01')).toBe(false);
    expect(formatDueDate('2026-11-13', '2026-11-13')).toBe('Hoje');
  });
});
