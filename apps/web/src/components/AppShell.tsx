import { NavLink, Outlet } from 'react-router-dom';

import { ModeSwitcher } from '../features/mode/ModeSwitcher.js';
import { useMode } from '../features/mode/mode-context.js';
import { canShowAuditNav } from '../features/mode/mode-ui.js';

export function AppShell() {
  const { mode } = useMode();

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-row">
          <h1>URMS</h1>
          <ModeSwitcher />
        </div>
      </header>
      <div className="app-body">
        <nav className="app-nav" aria-label="メインナビゲーション">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            ホーム
          </NavLink>
          <NavLink
            to="/resources"
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            Resource
          </NavLink>
          {canShowAuditNav(mode) ? (
            <NavLink to="/audit" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              監査ログ
            </NavLink>
          ) : null}
          <NavLink
            to="/knowledge"
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            Knowledge
          </NavLink>
        </nav>
        <main className="app-main">
          <Outlet />
        </main>
      </div>
      <footer className="app-footer">URMS v0.2.0</footer>
    </div>
  );
}
