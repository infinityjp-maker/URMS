import { DesktopErrorBoundary } from './components/DesktopErrorBoundary.js';

import { ScreenCatalog } from './app/ScreenCatalog.js';

import { useAppRoute } from './app/useAppRoute.js';

import { ModeProvider } from './features/mode/mode-context.js';

import { ModuleRouter } from './modules/ModuleRouter.js';

import { PerceptionDashboard } from './perception/PerceptionDashboard.js';



function AppContent() {

  const route = useAppRoute();

  if (route.kind === 'catalog') {

    return <ScreenCatalog />;

  }

  if (route.kind === 'screen') {

    if (route.screenId === 'D-01' || route.screenId.startsWith('D-01')) {

      return <PerceptionDashboard />;

    }

    return <ModuleRouter screenId={route.screenId} />;

  }

  return <PerceptionDashboard />;

}



export function App() {

  return (

    <DesktopErrorBoundary>

      <ModeProvider>

        <AppContent />

      </ModeProvider>

    </DesktopErrorBoundary>

  );

}

