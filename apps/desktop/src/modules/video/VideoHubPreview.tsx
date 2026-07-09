import { screenHref } from '../../app/appRoute.js';
import { useLifeState } from '../../hooks/useLifeState.js';
import { useVideoLibrary } from '../../hooks/useVideoLibrary.js';
import { formatDuration, formatGb } from './video-ui.js';

export function VideoHubPreview() {
  const life = useLifeState();
  const library = useVideoLibrary({ apiOnline: life.apiOnline });
  const rawItems = library.payload?.items.filter((item) => item.kind === 'raw') ?? [];
  const largest = library.payload?.items.reduce((max, item) =>
    item.sizeGb > (max?.sizeGb ?? 0) ? item : max,
  );

  return (
    <a href={screenHref('M-VID-LST')} className="glass-card glass-card--link video-hub">
      <p className="card-kicker">動画 · ライブラリへ</p>
      {library.loading ? (
        <p className="hint-line">ライブラリを確認中…</p>
      ) : library.payload ? (
        <>
          <p className="metric-detail">
            {library.payload.items.length} 本 · {formatGb(library.payload.totalSizeGb)}
          </p>
          {rawItems.length > 0 ? (
            <p className="video-hub__alert">raw {rawItems.length} 本 — 整理候補あり</p>
          ) : (
            <p className="hint-line">export · プロジェクト中心</p>
          )}
          {largest ? (
            <p className="hint-line">
              最大: {largest.title} · {formatGb(largest.sizeGb)}
            </p>
          ) : null}
        </>
      ) : (
        <p className="hint-line">動画ライブラリを取得できません</p>
      )}
    </a>
  );
}
