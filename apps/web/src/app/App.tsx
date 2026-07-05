import { BrowserRouter } from 'react-router-dom';

import { ModeProvider } from '../features/mode/mode-context.js';
import { AppRoutes } from './routes.js';

export function App() {
  return (
    <ModeProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ModeProvider>
  );
}
