import { IonIcon } from '@ionic/react';
import { addOutline, checkmarkDoneOutline, searchOutline } from 'ionicons/icons';

interface EmptyStateProps {
  searching?: boolean;
  completed?: boolean;
  onCreate?: () => void;
}

export function EmptyState({ searching, completed, onCreate }: EmptyStateProps): React.JSX.Element {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <IonIcon icon={searching ? searchOutline : checkmarkDoneOutline} />
      </span>
      <h3>
        {searching
          ? 'Nenhuma tarefa encontrada'
          : completed
            ? 'Suas conquistas ficam aqui'
            : 'Espaço para um novo começo'}
      </h3>
      <p>
        {searching
          ? 'Tente outra busca ou ajuste os filtros.'
          : completed
            ? 'Conclua uma tarefa e acompanhe seu progresso.'
            : 'Adicione uma tarefa e dê o primeiro passo. Uma coisa de cada vez.'}
      </p>
      {!searching && !completed && onCreate && (
        <button className="text-button" onClick={onCreate}>
          <IonIcon icon={addOutline} /> Criar uma tarefa
        </button>
      )}
    </div>
  );
}
