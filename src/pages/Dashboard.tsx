import { IonContent, IonIcon, IonPage, IonSearchbar, useIonRouter } from '@ionic/react';
import { arrowForwardOutline, checkmarkOutline, chevronForward, leafOutline } from 'ionicons/icons';
import { useState } from 'react';

import { CreateTaskButton } from '../components/CreateTaskButton';
import { LoadingState } from '../components/LoadingState';
import { TaskCollection } from '../components/TaskCollection';
import { TaskForm } from '../components/TaskForm';
import { useTasks } from '../contexts/useTasks';
import type { Task } from '../types/task';
import { categories, defaultFilters, smartLists } from '../utils/taskOptions';
import { filterTasks, getListCounts, sortTasks } from '../utils/tasks';
import { useToday } from '../utils/useToday';

export function Dashboard(): React.JSX.Element {
  const { tasks, ready } = useTasks();
  const router = useIonRouter();
  const today = useToday();
  const [query, setQuery] = useState('');
  const [editor, setEditor] = useState<Task | 'new' | null>(null);
  const counts = getListCounts(tasks, today);
  const progress = tasks.length ? Math.round((counts.completed / tasks.length) * 100) : 0;
  const results = sortTasks(filterTasks(tasks, { ...defaultFilters, query }));
  const dateLabel = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(
    new Date(`${today}T12:00:00`),
  );

  return (
    <IonPage>
      <IonContent className="dashboard-content">
        <main className="page-container dashboard">
          <header className="brand-header">
            <div className="brand">
              <span className="brand-icon">
                <IonIcon icon={checkmarkOutline} />
              </span>
              foco<span className="brand-dot">.</span>
            </div>
            <span className="local-label">
              <span />
              Seu espaço pessoal
            </span>
          </header>
          {ready ? (
            <>
              <div className="dashboard-heading">
                <p className="eyebrow">{dateLabel}</p>
                <h1>
                  Um passo de cada vez<span>.</span>
                </h1>
                <p>Menos na cabeça. Mais no seu dia.</p>
              </div>
              <IonSearchbar
                className="foco-search"
                value={query}
                debounce={0}
                onIonInput={(event) => setQuery(event.detail.value || '')}
                placeholder="Buscar nas suas tarefas"
                aria-label="Buscar nas suas tarefas"
              />
              {query.trim() ? (
                <section className="search-results">
                  <div className="section-heading">
                    <h2>Resultados da busca</h2>
                    <span>{results.length}</span>
                  </div>
                  <TaskCollection
                    tasks={results}
                    today={today}
                    searching
                    onEdit={setEditor}
                    onCreate={() => setEditor('new')}
                  />
                </section>
              ) : (
                <>
                  <button
                    className="focus-card"
                    onClick={() => router.push('/lists/today')}
                    aria-label={`Ver tarefas de hoje, ${counts.today} pendentes`}
                  >
                    <div className="focus-copy">
                      <span className="focus-eyebrow">
                        <IonIcon icon={leafOutline} />
                        UM POUCO DE FOCO
                      </span>
                      <h2>{counts.today ? 'Seu próximo passo\ncomeça hoje.' : 'Abra espaço para\no que importa.'}</h2>
                      <p>
                        {counts.today
                          ? `${counts.today} ${counts.today === 1 ? 'tarefa para cuidar' : 'tarefas para cuidar'}. Você consegue.`
                          : 'Organize seus planos e siga no seu ritmo.'}
                      </p>
                      <span className="focus-link">
                        Ver meu dia <IonIcon icon={arrowForwardOutline} />
                      </span>
                    </div>
                    <div className="focus-art" aria-hidden="true">
                      <div className="art-orbit" />
                      <div className="art-note">
                        <span className="art-line" />
                        <span className="art-line short" />
                        <span className="art-check">
                          <IonIcon icon={checkmarkOutline} />
                        </span>
                      </div>
                      <span className="art-spark one" />
                      <span className="art-spark two" />
                    </div>
                  </button>
                  <section className="smart-section" aria-labelledby="smart-heading">
                    <div className="section-heading">
                      <h2 id="smart-heading">Visão geral</h2>
                      <span className="section-caption">Tudo no seu lugar</span>
                    </div>
                    <div className="smart-grid">
                      {smartLists.map((list) => (
                        <button
                          className={`smart-card ${list.id === 'completed' ? 'completed-card' : ''}`}
                          key={list.id}
                          onClick={() => router.push(`/lists/${list.id}`)}
                          aria-label={`${list.label}, ${counts[list.id]} tarefas`}
                        >
                          <span className={`list-icon tone-${list.color}`}>
                            <IonIcon icon={list.icon} />
                          </span>
                          <span className="smart-count" data-testid={`count-${list.id}`}>
                            {counts[list.id]}
                          </span>
                          <span className="smart-label">{list.label}</span>
                          {list.id === 'completed' && <IonIcon className="card-chevron" icon={chevronForward} />}
                        </button>
                      ))}
                    </div>
                  </section>
                  <section className="categories-section" aria-labelledby="categories-heading">
                    <div className="section-heading">
                      <h2 id="categories-heading">Minhas categorias</h2>
                      <span className="section-caption">3 categorias</span>
                    </div>
                    <div className="category-list">
                      {categories.map((category) => (
                        <button
                          className="category-row"
                          key={category.id}
                          onClick={() => router.push(`/categories/${category.id}`)}
                          aria-label={`Abrir categoria ${category.label}`}
                        >
                          <span className={`list-icon tone-${category.color}`}>
                            <IonIcon icon={category.icon} />
                          </span>
                          <span className="category-copy">
                            <strong>{category.label}</strong>
                            <span>{category.hint}</span>
                          </span>
                          <span className="category-count" data-testid={`count-${category.id}`}>
                            {tasks.filter((task) => task.category === category.id && !task.completed).length}
                          </span>
                          <IonIcon className="row-chevron" icon={chevronForward} />
                        </button>
                      ))}
                    </div>
                    <p className="category-footnote">Os contadores das categorias mostram tarefas pendentes.</p>
                  </section>
                  <div className="progress-note">
                    <span
                      className="progress-ring"
                      style={{ background: `conic-gradient(var(--ion-color-primary) ${progress}%, #e2e8f0 0)` }}
                    >
                      <IonIcon icon={checkmarkOutline} />
                    </span>
                    <div>
                      <strong>
                        {tasks.length
                          ? `${counts.completed} de ${tasks.length} tarefas concluídas`
                          : 'Pequenos passos, grandes conquistas'}
                      </strong>
                      <p>
                        {tasks.length
                          ? `${progress}% do caminho. Cada passo conta.`
                          : 'Seu próximo capítulo começa com uma tarefa.'}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </>
          ) : (
            <LoadingState />
          )}
        </main>
      </IonContent>
      {ready && <CreateTaskButton onClick={() => setEditor('new')} />}
      {editor && <TaskForm task={editor === 'new' ? undefined : editor} onClose={() => setEditor(null)} />}
    </IonPage>
  );
}
