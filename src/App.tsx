import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Navigate, Route } from 'react-router-dom';

import { TasksProvider } from './contexts/TasksProvider';
import { Dashboard } from './pages/Dashboard';
import { TaskList } from './pages/TaskList';
import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import './theme/variables.css';
import './theme/app.css';

setupIonicReact({ mode: 'ios' });

export default function App(): React.JSX.Element {
  return (
    <IonApp>
      <TasksProvider>
        <IonReactRouter>
          <IonRouterOutlet>
            <Route path="/home" element={<Dashboard />} />
            <Route path="/lists/:listId" element={<TaskList />} />
            <Route path="/categories/:categoryId" element={<TaskList />} />
            <Route path="*" element={<Navigate to="/home" replace />} />
          </IonRouterOutlet>
        </IonReactRouter>
      </TasksProvider>
    </IonApp>
  );
}
