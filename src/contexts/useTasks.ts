import { useContext } from 'react';

import { TasksContext } from './tasksContext';
import type { TasksContextValue } from './tasksContext';

export function useTasks(): TasksContextValue {
  const context = useContext(TasksContext);
  if (!context) throw new Error('useTasks must be used inside TasksProvider.');
  return context;
}
