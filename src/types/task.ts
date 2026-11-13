export type Category = 'work' | 'study' | 'personal';
export type Priority = 'high' | 'medium' | 'low';
export type SmartList = 'today' | 'planned' | 'all' | 'priority' | 'completed';
export type TaskStatus = 'all' | 'pending' | 'completed';

export interface TaskDraft {
  title: string;
  description: string;
  category: Category;
  priority: Priority;
  dueDate?: string;
}

export interface Task extends TaskDraft {
  id: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaskFilters {
  query: string;
  category: Category | 'all';
  priority: Priority | 'all';
  status: TaskStatus;
}

export type TaskAction =
  | { type: 'load'; tasks: Task[] }
  | { type: 'add'; task: Task }
  | { type: 'update'; id: string; draft: TaskDraft; updatedAt: string }
  | { type: 'delete'; id: string }
  | { type: 'toggle'; id: string; updatedAt: string };
