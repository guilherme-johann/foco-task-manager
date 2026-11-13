import { IonButton, IonFooter, IonIcon, IonToolbar } from '@ionic/react';
import { addCircle } from 'ionicons/icons';

export function CreateTaskButton({ onClick }: { onClick: () => void }): React.JSX.Element {
  return (
    <IonFooter className="create-footer ion-no-border">
      <IonToolbar>
        <div className="footer-inner">
          <IonButton className="create-task-button" fill="clear" onClick={onClick}>
            <IonIcon slot="start" icon={addCircle} />
            Nova tarefa
          </IonButton>
          <span className="footer-brand">um passo de cada vez</span>
        </div>
      </IonToolbar>
    </IonFooter>
  );
}
