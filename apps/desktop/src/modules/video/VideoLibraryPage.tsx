import { videoDetailHref } from '../../app/appRoute.js';
import { useLifeState } from '../../hooks/useLifeState.js';
import { useVideoLibrary } from '../../hooks/useVideoLibrary.js';
import { ModuleScreenLayout } from '../ModuleScreenLayout.js';
import { formatDuration, formatGb, kindLabel } from './video-ui.js';

export function VideoLibraryPage() {
  const life = useLifeState();
  const library = useVideoLibrary({ apiOnline: life.apiOnline });

  return (
    <ModuleScreenLayout screenId="M-VID-LST" title="動画ライブラリ" moduleLabel="動画">
      <section className="glass-card">
        <p className="card-kicker">ライブラリ · メタデータ</p>
        {library.loading ? (
          <p className="hint-line">動画一覧を取得中…</p>
        ) : library.payload ? (
          <>
            <p className="metric-detail">
              {library.payload.items.length} 本 · {formatDuration(library.payload.totalDurationMin)} ·{' '}
              {formatGb(library.payload.totalSizeGb)}
              {library.payload.source === 'catalog' ? ' · カタログ表示' : ''}
            </p>
            <ul className="video-list">
              {library.payload.items.map((item) => (
                <li key={item.id}>
                  <a href={videoDetailHref(item.id)} className="video-list__link">
                    <div className="video-list__header">
                      <span className="video-list__title">{item.title}</span>
                      <span className="video-list__kind">{kindLabel(item.kind)}</span>
                    </div>
                    <p className="video-list__meta">
                      {formatDuration(item.durationMin)} · {formatGb(item.sizeGb)} · {item.resolution}
                    </p>
                    <p className="video-list__path">{item.path}</p>
                    <p className="video-list__summary">{item.summary}</p>
                  </a>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="hint-line">
            {library.error
              ? 'API 未起動 — start-dev-servers.bat で起動してください'
              : '動画一覧を取得できません'}
          </p>
        )}
      </section>
    </ModuleScreenLayout>
  );
}
