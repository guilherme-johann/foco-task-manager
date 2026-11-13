import type { Task, TaskAction } from '../types/task';

export function taskReducer(tasks: Task[], action: TaskAction): Task[] {
  switch (action.type) {
    case 'load':
      return action.tasks;
    case 'add':
      return [action.task, ...tasks];
    case 'update':
      return tasks.map((task) =>
        task.id === action.id ? { ...task, ...action.draft, updatedAt: action.updatedAt } : task,
      );
    case 'delete':
      return tasks.filter((task) => task.id !== action.id);
    case 'toggle':
      return tasks.map((task) =>
        task.id === action.id ? { ...task, completed: !task.completed, updatedAt: action.updatedAt } : task,
      );
  }
}
