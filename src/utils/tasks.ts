import type { SmartList, Task, TaskDraft, TaskFilters } from '../types/task';

import { getLocalDate, isValidDate } from './date';

const priorityRank = { high: 0, medium: 1, low: 2 };

export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR');
}

export function validateDraft(draft: TaskDraft): string | null {
  if (!draft.title.trim()) return 'Dê um título à sua tarefa.';
  if (draft.title.trim().length > 120) return 'Use até 120 caracteres no título.';
  if (draft.description.length > 2000) return 'Use até 2.000 caracteres na descrição.';
  if (!['work', 'study', 'personal'].includes(draft.category)) return 'Selecione uma categoria válida.';
  if (!['high', 'medium', 'low'].includes(draft.priority)) return 'Selecione uma prioridade válida.';
  if (draft.dueDate && !isValidDate(draft.dueDate)) return 'Informe uma data válida.';
  return null;
}

export function cleanDraft(draft: TaskDraft): TaskDraft {
  const error = validateDraft(draft);
  if (error) throw new Error(error);
  return {
    ...draft,
    title: draft.title.trim(),
    description: draft.description.trim(),
    dueDate: draft.dueDate || undefined,
  };
}

export function createTask(draft: TaskDraft): Task {
  const now = new Date().toISOString();
  /** getRandomValues also works on the HTTP address used by emulator live reload. */
  const id =
    typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) => byte.toString(16).padStart(2, '0')).join('');
  return { ...cleanDraft(draft), id, completed: false, createdAt: now, updatedAt: now };
}

export function matchesList(task: Task, list: SmartList, today = getLocalDate()): boolean {
  switch (list) {
    case 'today':
      return !task.completed && !!task.dueDate && task.dueDate <= today;
    case 'planned':
      return !task.completed && !!task.dueDate;
    case 'priority':
      return !task.completed && task.priority === 'high';
    case 'completed':
      return task.completed;
    case 'all':
      return true;
  }
}

export function filterTasks(tasks: Task[], filters: TaskFilters): Task[] {
  const query = normalizeText(filters.query.trim());
  return tasks.filter(
    (task) =>
      (!query || normalizeText(`${task.title} ${task.description}`).includes(query)) &&
      (filters.category === 'all' || task.category === filters.category) &&
      (filters.priority === 'all' || task.priority === filters.priority) &&
      (filters.status === 'all' || (filters.status === 'completed' ? task.completed : !task.completed)),
  );
}

export function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort(
    (a, b) =>
      Number(a.completed) - Number(b.completed) ||
      (a.dueDate || '9999-12-31').localeCompare(b.dueDate || '9999-12-31') ||
      priorityRank[a.priority] - priorityRank[b.priority] ||
      b.createdAt.localeCompare(a.createdAt) ||
      a.id.localeCompare(b.id),
  );
}

export function getListCounts(tasks: Task[], today = getLocalDate()): Record<SmartList, number> {
  return {
    today: tasks.filter((task) => matchesList(task, 'today', today)).length,
    planned: tasks.filter((task) => matchesList(task, 'planned', today)).length,
    all: tasks.length,
    priority: tasks.filter((task) => matchesList(task, 'priority', today)).length,
    completed: tasks.filter((task) => task.completed).length,
  };
}
