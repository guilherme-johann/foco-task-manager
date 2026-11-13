import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonModal,
  IonSpinner,
  IonTitle,
  IonToolbar,
  useIonToast,
} from '@ionic/react';
import { calendarOutline, checkmarkOutline, documentTextOutline, flagOutline, gridOutline } from 'ionicons/icons';
import { useRef, useState } from 'react';

import { useTasks } from '../contexts/useTasks';
import type { Category, Priority, Task, TaskDraft } from '../types/task';
import { categories, priorities } from '../utils/taskOptions';
import { validateDraft } from '../utils/tasks';

interface TaskFormProps {
  task?: Task;
  initialCategory?: Category;
  initialDate?: string;
  initialPriority?: Priority;
  onClose: () => void;
}

export function TaskForm({
  task,
  initialCategory,
  initialDate,
  initialPriority,
  onClose,
}: TaskFormProps): React.JSX.Element {
  const { addTask, updateTask } = useTasks();
  const [draft, setDraft] = useState<TaskDraft>(
    task
      ? {
          title: task.title,
          description: task.description,
          category: task.category,
          priority: task.priority,
          dueDate: task.dueDate,
        }
      : {
          title: '',
          description: '',
          category: initialCategory || 'personal',
          priority: initialPriority || 'medium',
          dueDate: initialDate,
        },
  );
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const modalRef = useRef<HTMLIonModalElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const [presentToast] = useIonToast();
  const updateDraft = (change: Partial<TaskDraft>) => {
    setDraft((value) => ({ ...value, ...change }));
    setError('');
  };

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (savingRef.current) return;
    const validation = validateDraft(draft);
    if (validation) {
      setError(validation);
      titleRef.current?.focus();
      return;
    }
    savingRef.current = true;
    setSaving(true);
    try {
      if (task) await updateTask(task.id, draft);
      else await addTask(draft);
      void presentToast({
        message: task ? 'Alterações salvas.' : 'Tarefa criada. Um passo mais perto!',
        duration: 2200,
        position: 'bottom',
        cssClass: 'foco-toast',
      });
      savingRef.current = false;
      await modalRef.current?.dismiss();
    } catch {
      savingRef.current = false;
      setError('Não foi possível salvar a tarefa. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <IonModal
      ref={modalRef}
      isOpen
      className="task-modal"
      canDismiss={() => Promise.resolve(!savingRef.current)}
      onDidDismiss={onClose}
    >
      <IonHeader className="ion-no-border">
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton
              disabled={saving}
              onClick={() => {
                void modalRef.current?.dismiss();
              }}
            >
              Cancelar
            </IonButton>
          </IonButtons>
          <IonTitle>{task ? 'Editar tarefa' : 'Nova tarefa'}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <form
          className="task-form"
          noValidate
          onSubmit={(event) => {
            void submit(event);
          }}
        >
          <div className="form-intro">
            <span className="form-symbol">
              <IonIcon icon={documentTextOutline} />
            </span>
            <h2>{task ? 'Ajuste seus planos.' : 'Tire uma ideia do papel.'}</h2>
            <p>{task ? 'Pequenos ajustes também fazem parte.' : 'Tudo começa com um próximo passo.'}</p>
          </div>
          <fieldset disabled={saving}>
            <div className="form-card">
              <label className="field-label" htmlFor="task-title">
                Título <span className="required-mark">*</span>
              </label>
              <input
                ref={titleRef}
                id="task-title"
                name="title"
                className="title-input"
                value={draft.title}
                maxLength={120}
                placeholder="O que você quer fazer?"
                required
                aria-required="true"
                aria-invalid={!!error && !draft.title.trim()}
                aria-describedby={error ? 'form-error' : undefined}
                onChange={(event) => updateDraft({ title: event.target.value })}
              />
              <div className="field-divider" />
              <label className="field-label" htmlFor="task-description">
                Descrição <span>opcional</span>
              </label>
              <textarea
                id="task-description"
                name="description"
                value={draft.description}
                maxLength={2000}
                rows={3}
                placeholder="Detalhes que ajudam a dar o próximo passo…"
                onChange={(event) => updateDraft({ description: event.target.value })}
              />
            </div>
            <h3 className="form-section-title">DO SEU JEITO</h3>
            <div className="form-card form-options">
              <label className="option-field" htmlFor="task-category">
                <span className="option-label">
                  <IonIcon icon={gridOutline} />
                  Categoria
                </span>
                <select
                  id="task-category"
                  value={draft.category}
                  onChange={(event) => updateDraft({ category: event.target.value as Category })}
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="option-field" htmlFor="task-priority">
                <span className="option-label">
                  <IonIcon icon={flagOutline} />
                  Prioridade
                </span>
                <select
                  id="task-priority"
                  value={draft.priority}
                  onChange={(event) => updateDraft({ priority: event.target.value as Priority })}
                >
                  {priorities.map((priority) => (
                    <option key={priority.id} value={priority.id}>
                      {priority.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="option-field date-field" htmlFor="task-date">
                <span className="option-label">
                  <IonIcon icon={calendarOutline} />
                  Vencimento<span className="optional-label">opcional</span>
                </span>
                <input
                  id="task-date"
                  type="date"
                  min="0001-01-01"
                  max="9999-12-31"
                  value={draft.dueDate || ''}
                  onChange={(event) => updateDraft({ dueDate: event.target.value || undefined })}
                />
              </label>
              {draft.dueDate && (
                <button
                  className="text-button clear-date"
                  type="button"
                  onClick={() => updateDraft({ dueDate: undefined })}
                >
                  Remover data
                </button>
              )}
            </div>
          </fieldset>
          {error && (
            <p id="form-error" className="form-error" role="alert">
              {error}
            </p>
          )}
          <button className="primary-button save-button" type="submit" disabled={saving}>
            {saving ? <IonSpinner name="crescent" /> : <IonIcon icon={checkmarkOutline} />}
            {saving ? 'Salvando…' : task ? 'Salvar alterações' : 'Criar tarefa'}
          </button>
          <p className="form-footnote">Seus planos ficam salvos neste dispositivo.</p>
        </form>
      </IonContent>
    </IonModal>
  );
}
