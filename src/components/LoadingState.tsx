import { IonSpinner } from '@ionic/react';

import { useTasks } from '../contexts/useTasks';

export function LoadingState(): React.JSX.Element {
  const { loadError, retryLoad } = useTasks();
  return (
    <div className="loading-state" role={loadError ? 'alert' : 'status'}>
      {loadError ? (
        <>
          <h2>Não foi possível abrir suas tarefas</h2>
          <p>Seus dados salvos foram preservados. Tente carregar novamente.</p>
          <button className="primary-button" onClick={retryLoad}>
            Tentar novamente
          </button>
        </>
      ) : (
        <>
          <IonSpinner name="crescent" />
          <p>Preparando seu espaço…</p>
        </>
      )}
    </div>
  );
}
