import {
  briefcaseOutline,
  calendarOutline,
  checkmarkCircleOutline,
  flagOutline,
  layersOutline,
  personOutline,
  schoolOutline,
  sunnyOutline,
} from 'ionicons/icons';

import type { Category, Priority, SmartList, TaskFilters } from '../types/task';

export const categories: { id: Category; label: string; icon: string; color: string; hint: string }[] = [
  { id: 'work', label: 'Trabalho', icon: briefcaseOutline, color: 'blue', hint: 'Ideias, projetos e entregas' },
  { id: 'study', label: 'Estudo', icon: schoolOutline, color: 'purple', hint: 'Um aprendizado por vez' },
  { id: 'personal', label: 'Pessoal', icon: personOutline, color: 'green', hint: 'Tempo para o que é seu' },
];

export const priorities: { id: Priority; label: string }[] = [
  { id: 'high', label: 'Alta' },
  { id: 'medium', label: 'Média' },
  { id: 'low', label: 'Baixa' },
];

export const smartLists: { id: SmartList; label: string; icon: string; color: string; hint: string }[] = [
  { id: 'today', label: 'Hoje', icon: sunnyOutline, color: 'blue', hint: 'Para hoje e tarefas atrasadas' },
  { id: 'planned', label: 'Planejadas', icon: calendarOutline, color: 'orange', hint: 'Suas tarefas com data marcada' },
  { id: 'all', label: 'Todas', icon: layersOutline, color: 'slate', hint: 'Tudo o que você quer realizar' },
  { id: 'priority', label: 'Prioritárias', icon: flagOutline, color: 'red', hint: 'O que merece sua atenção primeiro' },
  { id: 'completed', label: 'Concluídas', icon: checkmarkCircleOutline, color: 'green', hint: 'Cada conquista conta' },
];

export const defaultFilters: TaskFilters = { query: '', category: 'all', priority: 'all', status: 'all' };
