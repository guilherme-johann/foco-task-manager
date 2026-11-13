import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import type { PropsWithChildren } from 'react';

import { loadTasks, saveTasks } from '../services/taskStorage';
import type { Task, TaskAction } from '../types/task';
import { cleanDraft, createTask } from '../utils/tasks';

import { taskReducer } from './taskReducer';
import { TasksContext } from './tasksContext';

export function TasksProvider({ children }: PropsWithChildren): React.JSX.Element {
  const [tasks, dispatch] = useReducer(taskReducer, []);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const tasksRef = useRef<Task[]>([]);
  const queueRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    let active = true;
    loadTasks()
      .then((saved) => {
        if (!active) return;
        tasksRef.current = saved;
        dispatch({ type: 'load', tasks: saved });
        setReady(true);
        setLoadError(false);
      })
      .catch(() => {
        if (active) setLoadError(true);
      });
    return () => {
      active = false;
    };
  }, [loadAttempt]);

  /** Serialize changes and publish them only after successful persistence. */
  const commit = useCallback(
    (action: TaskAction): Promise<void> => {
      if (!ready) return Promise.reject(new Error('Aguarde o carregamento das tarefas.'));
      const operation = queueRef.current.then(async () => {
        if ('id' in action && !tasksRef.current.some((task) => task.id === action.id)) {
          throw new Error('Esta tarefa não está mais disponível.');
        }
        const next = taskReducer(tasksRef.current, action);
        await saveTasks(next);
        tasksRef.current = next;
        dispatch(action);
      });
      queueRef.current = operation.catch(() => undefined);
      return operation;
    },
    [ready],
  );

  return (
    <TasksContext.Provider
      value={{
        tasks,
        ready,
        loadError,
        retryLoad: () => {
          setLoadError(false);
          setLoadAttempt((attempt) => attempt + 1);
        },
        addTask: (draft) => commit({ type: 'add', task: createTask(draft) }),
        updateTask: (id, draft) =>
          commit({ type: 'update', id, draft: cleanDraft(draft), updatedAt: new Date().toISOString() }),
        deleteTask: (id) => commit({ type: 'delete', id }),
        toggleTask: (id) => commit({ type: 'toggle', id, updatedAt: new Date().toISOString() }),
      }}
    >
      {children}
    </TasksContext.Provider>
  );
}
