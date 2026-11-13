import { useIonAlert, useIonToast } from '@ionic/react';
import { useState } from 'react';

import { useTasks } from '../contexts/useTasks';
import type { Task } from '../types/task';

import { EmptyState } from './EmptyState';
import { TaskRow } from './TaskRow';

interface TaskCollectionProps {
  tasks: Task[];
  today: string;
  searching?: boolean;
  completed?: boolean;
  onEdit: (task: Task) => void;
  onCreate: () => void;
}

export function TaskCollection({
  tasks,
  today,
  searching,
  completed,
  onEdit,
  onCreate,
}: TaskCollectionProps): React.JSX.Element {
  const { toggleTask, deleteTask } = useTasks();
  const [presentAlert] = useIonAlert();
  const [presentToast] = useIonToast();
  const [busyIds, setBusyIds] = useState<string[]>([]);

  async function runMutation(task: Task, operation: () => Promise<void>, message: string) {
    setBusyIds((ids) => [...ids, task.id]);
    try {
      await operation();
      await presentToast({ message, duration: 2000, position: 'bottom', cssClass: 'foco-toast' });
    } catch {
      await presentToast({
        message: 'Não foi possível salvar. Tente novamente.',
        duration: 3500,
        color: 'danger',
        position: 'bottom',
      });
    } finally {
      setBusyIds((ids) => ids.filter((id) => id !== task.id));
    }
  }

  function confirmDelete(task: Task) {
    void presentAlert({
      header: 'Excluir tarefa?',
      message: 'A tarefa será removida permanentemente deste dispositivo.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Excluir',
          role: 'destructive',
          handler: () => {
            void runMutation(task, () => deleteTask(task.id), 'Tarefa excluída.');
          },
        },
      ],
    });
  }

  if (!tasks.length) return <EmptyState searching={searching} completed={completed} onCreate={onCreate} />;
  return (
    <div className="task-collection">
      {tasks.map((task) => (
        <TaskRow
          key={task.id}
          task={task}
          today={today}
          busy={busyIds.includes(task.id)}
          onEdit={onEdit}
          onDelete={confirmDelete}
          onToggle={(item) => {
            void runMutation(
              item,
              () => toggleTask(item.id),
              item.completed ? 'Tarefa reaberta.' : 'Boa! Mais uma tarefa concluída.',
            );
          }}
        />
      ))}
    </div>
  );
}
