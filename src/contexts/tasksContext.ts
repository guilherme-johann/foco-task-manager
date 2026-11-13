import { createContext } from 'react';

import type { Task, TaskDraft } from '../types/task';

export interface TasksContextValue {
  tasks: Task[];
  ready: boolean;
  loadError: boolean;
  retryLoad: () => void;
  addTask: (draft: TaskDraft) => Promise<void>;
  updateTask: (id: string, draft: TaskDraft) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
}

export const TasksContext = createContext<TasksContextValue | undefined>(undefined);
