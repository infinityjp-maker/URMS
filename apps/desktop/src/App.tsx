import { ModeProvider } from './features/mode/mode-context.js';
import { PerceptionDashboard } from './perception/PerceptionDashboard.js';

export function App() {
  return (
    <ModeProvider>
      <PerceptionDashboard />
    </ModeProvider>
  );
}
