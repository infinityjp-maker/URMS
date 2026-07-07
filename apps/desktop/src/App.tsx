import { DesktopErrorBoundary } from './components/DesktopErrorBoundary.js';
import { ModeProvider } from './features/mode/mode-context.js';
import { PerceptionDashboard } from './perception/PerceptionDashboard.js';

export function App() {
  return (
    <DesktopErrorBoundary>
      <ModeProvider>
        <PerceptionDashboard />
      </ModeProvider>
    </DesktopErrorBoundary>
  );
}
