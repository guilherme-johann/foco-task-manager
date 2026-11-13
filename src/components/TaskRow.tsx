import { IonCheckbox, IonIcon } from '@ionic/react';
import { calendarOutline, flagOutline, trashOutline } from 'ionicons/icons';

import type { Task } from '../types/task';
import { formatDueDate } from '../utils/date';
import { categories, priorities } from '../utils/taskOptions';

interface TaskRowProps {
  task: Task;
  today: string;
  busy: boolean;
  onToggle: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

export function TaskRow({ task, today, busy, onToggle, onEdit, onDelete }: TaskRowProps): React.JSX.Element {
  const category = categories.find((item) => item.id === task.category)!;
  const priority = priorities.find((item) => item.id === task.priority)!;
  const overdue = !task.completed && !!task.dueDate && task.dueDate < today;
  return (
    <article className={`task-row ${task.completed ? 'is-completed' : ''}`} data-testid="task-row">
      <IonCheckbox
        className="task-checkbox"
        checked={task.completed}
        disabled={busy}
        aria-label={`${task.completed ? 'Reabrir' : 'Concluir'} tarefa ${task.title}`}
        onIonChange={() => onToggle(task)}
      />
      <button className="task-body" onClick={() => onEdit(task)} aria-label={`Editar tarefa ${task.title}`}>
        <span className="task-title">{task.title}</span>
        {task.description && <span className="task-description">{task.description}</span>}
        <span className="task-meta">
          <span className={`category-tag tone-${category.color}`}>{category.label}</span>
          <span className={`priority-tag priority-${task.priority}`}>
            <IonIcon icon={flagOutline} />
            {priority.label}
          </span>
          {task.dueDate && (
            <span className={overdue ? 'due-date overdue' : 'due-date'}>
              <IonIcon icon={calendarOutline} />
              {overdue ? 'Atrasada · ' : ''}
              {formatDueDate(task.dueDate, today)}
            </span>
          )}
        </span>
      </button>
      <button
        className="icon-button delete-button"
        aria-label={`Excluir tarefa ${task.title}`}
        disabled={busy}
        onClick={() => onDelete(task)}
      >
        <IonIcon icon={trashOutline} />
      </button>
    </article>
  );
}
