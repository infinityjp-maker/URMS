import { useAppRoute } from './useAppRoute.js';
import { APP_NAV_ITEMS } from './module-nav.js';

export function AppNav() {
  const route = useAppRoute();

  return (
    <nav className="app-nav" aria-label="メインナビゲーション">
      {APP_NAV_ITEMS.map((item) => {
        const active = item.isActive(route);
        return (
          <a
            key={item.id}
            href={item.href}
            className={`app-nav__item${active ? ' app-nav__item--active' : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            <span className="app-nav__glyph" aria-hidden="true">
              {item.glyph}
            </span>
            <span className="app-nav__label">{item.label}</span>
          </a>
        );
      })}
    </nav>
  );
}
