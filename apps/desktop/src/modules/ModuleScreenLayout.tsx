import type { ReactNode } from 'react';

import { AppNav } from '../app/AppNav.js';
import { moduleAccentForScreen } from '../app/module-nav.js';
import { catalogHref, hubHref } from '../app/appRoute.js';
import { screenById } from './screen-registry.js';

type Props = {
  readonly screenId: string;
  readonly title: string;
  readonly moduleLabel: string;
  readonly children: ReactNode;
};

export function ModuleScreenLayout({ screenId, title, moduleLabel, children }: Props) {
  const meta = screenById(screenId);
  const accent = moduleAccentForScreen(screenId);

  return (
    <div className={`module-screen${accent ? ` module-screen--${accent}` : ''}`}>
      <header className="module-screen__header">
        <div className="module-screen__accent-bar" aria-hidden="true" />
        <nav className="module-screen__nav-row" aria-label="画面ナビ">
          <a className="module-screen__back" href={hubHref()}>
            ← ハブ
          </a>
          <a className="module-screen__catalog" href={catalogHref()}>
            画面一覧
          </a>
        </nav>
        <p className="module-screen__kicker">
          {moduleLabel} · {screenId}
        </p>
        <h1 className="module-screen__title">{title}</h1>
        {meta?.status === 'stub' ? (
          <p className="module-screen__badge">準備中 — {meta.note}</p>
        ) : null}
      </header>
      <main className="module-screen__body">{children}</main>
      <AppNav />
    </div>
  );
}
