import type { TaskFilters as Filters } from '../types/task';
import { categories, priorities } from '../utils/taskOptions';

interface TaskFiltersProps {
  value: Filters;
  onChange: (filters: Filters) => void;
}

export function TaskFilters({ value, onChange }: TaskFiltersProps): React.JSX.Element {
  return (
    <div className="filter-panel" aria-label="Filtros de tarefas">
      <label>
        Categoria
        <select
          value={value.category}
          onChange={(event) => onChange({ ...value, category: event.target.value as Filters['category'] })}
        >
          <option value="all">Todas as categorias</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Prioridade
        <select
          value={value.priority}
          onChange={(event) => onChange({ ...value, priority: event.target.value as Filters['priority'] })}
        >
          <option value="all">Todas as prioridades</option>
          {priorities.map((priority) => (
            <option key={priority.id} value={priority.id}>
              {priority.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Situação
        <select
          value={value.status}
          onChange={(event) => onChange({ ...value, status: event.target.value as Filters['status'] })}
        >
          <option value="all">Todas as situações</option>
          <option value="pending">Pendentes</option>
          <option value="completed">Concluídas</option>
        </select>
      </label>
    </div>
  );
}
