import { DashboardPage } from '../features/dashboard/DashboardPage.js';

export function App() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>URMS — Unified Resource Management System</h1>
      </header>
      <main className="app-main">
        <DashboardPage />
      </main>
    </div>
  );
}
