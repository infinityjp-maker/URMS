import { MODULE_LAUNCHER_ITEMS } from './module-nav.js';

export function ModuleLauncher() {
  return (
    <section className="module-launcher" aria-label="機能">
      <div className="module-launcher__header">
        <h2 className="module-launcher__title">機能</h2>
        <p className="module-launcher__lead">モジュールごとに画面の見た目を分けています</p>
      </div>
      <div className="module-launcher__grid">
        {MODULE_LAUNCHER_ITEMS.map((item) => (
          <a
            key={item.id}
            href={item.href}
            className={`module-tile module-tile--${item.accent}`}
          >
            <span className="module-tile__glyph" aria-hidden="true">
              {item.glyph}
            </span>
            <span className="module-tile__label">{item.label}</span>
            <span className="module-tile__desc">{item.description}</span>
          </a>
        ))}
      </div>
    </section>
  );
}
