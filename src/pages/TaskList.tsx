import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonSearchbar,
  IonToolbar,
} from '@ionic/react';
import { optionsOutline } from 'ionicons/icons';
import { useState } from 'react';
import { useParams } from 'react-router-dom';

import { CreateTaskButton } from '../components/CreateTaskButton';
import { LoadingState } from '../components/LoadingState';
import { TaskCollection } from '../components/TaskCollection';
import { TaskFilters } from '../components/TaskFilters';
import { TaskForm } from '../components/TaskForm';
import { useTasks } from '../contexts/useTasks';
import type { Task } from '../types/task';
import { categories, defaultFilters, smartLists } from '../utils/taskOptions';
import { filterTasks, matchesList, sortTasks } from '../utils/tasks';
import { useToday } from '../utils/useToday';

export function TaskList(): React.JSX.Element {
  const { listId, categoryId } = useParams();
  const { tasks, ready } = useTasks();
  const today = useToday();
  const [filters, setFilters] = useState(defaultFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [editor, setEditor] = useState<Task | 'new' | null>(null);
  const list = smartLists.find((item) => item.id === listId);
  const category = categories.find((item) => item.id === categoryId);
  const selection = category || list;
  const scopedTasks = category
    ? tasks.filter((task) => task.category === category.id)
    : list
      ? tasks.filter((task) => matchesList(task, list.id, today))
      : [];
  const visibleTasks = sortTasks(filterTasks(scopedTasks, filters));
  const hasFilters =
    !!filters.query.trim() || filters.category !== 'all' || filters.priority !== 'all' || filters.status !== 'all';
  const filterCount =
    Number(filters.category !== 'all') + Number(filters.priority !== 'all') + Number(filters.status !== 'all');

  return (
    <IonPage>
      <IonHeader className="ion-no-border list-header">
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" text="Início" />
          </IonButtons>
          <IonButtons slot="end">
            <IonButton
              aria-label="Mostrar filtros"
              aria-expanded={showFilters}
              onClick={() => setShowFilters((value) => !value)}
            >
              <IonIcon slot="start" icon={optionsOutline} />
              Filtros{filterCount > 0 ? ` (${filterCount})` : ''}
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <main className="page-container task-list-page">
          {ready ? (
            selection ? (
              <>
                <header className="list-heading">
                  <span className={`list-icon large-icon tone-${selection.color}`}>
                    <IonIcon icon={selection.icon} />
                  </span>
                  <h1>{selection.label}</h1>
                  <p>{selection.hint}</p>
                  <span className="list-summary">
                    {scopedTasks.length} {scopedTasks.length === 1 ? 'tarefa' : 'tarefas'}
                    {category && ` · ${scopedTasks.filter((task) => !task.completed).length} pendentes`}
                  </span>
                </header>
                <IonSearchbar
                  className="foco-search"
                  value={filters.query}
                  debounce={0}
                  onIonInput={(event) => setFilters((value) => ({ ...value, query: event.detail.value || '' }))}
                  placeholder="Buscar por título ou descrição"
                  aria-label="Buscar por título ou descrição"
                />
                {showFilters && <TaskFilters value={filters} onChange={setFilters} />}
                <div className="results-heading">
                  <span>
                    {hasFilters
                      ? `${visibleTasks.length} ${visibleTasks.length === 1 ? 'resultado' : 'resultados'}`
                      : 'SUAS TAREFAS'}
                  </span>
                  {hasFilters ? (
                    <button className="text-button" onClick={() => setFilters(defaultFilters)}>
                      Limpar filtros
                    </button>
                  ) : (
                    <span>Vencimento · prioridade</span>
                  )}
                </div>
                <TaskCollection
                  tasks={visibleTasks}
                  today={today}
                  searching={hasFilters}
                  completed={list?.id === 'completed'}
                  onEdit={setEditor}
                  onCreate={() => setEditor('new')}
                />
                {visibleTasks.length > 0 && (
                  <p className="list-footnote">Toque em uma tarefa para editar seus detalhes.</p>
                )}
              </>
            ) : (
              <div className="empty-state">
                <h1>Lista não encontrada</h1>
                <p>Volte ao início e escolha uma das suas listas.</p>
              </div>
            )
          ) : (
            <LoadingState />
          )}
        </main>
      </IonContent>
      {ready && selection && <CreateTaskButton onClick={() => setEditor('new')} />}
      {editor && (
        <TaskForm
          task={editor === 'new' ? undefined : editor}
          initialCategory={category?.id}
          initialDate={list?.id === 'today' || list?.id === 'planned' ? today : undefined}
          initialPriority={list?.id === 'priority' ? 'high' : undefined}
          onClose={() => setEditor(null)}
        />
      )}
    </IonPage>
  );
}
