import { readVideoId, screenHref, storageDetailHref } from '../../app/appRoute.js';
import { useLifeState } from '../../hooks/useLifeState.js';
import { useVideoDetail, useVideoLibrary } from '../../hooks/useVideoLibrary.js';
import { ModuleScreenLayout } from '../ModuleScreenLayout.js';
import { formatDuration, formatGb, kindLabel } from './video-ui.js';

export function VideoDetailPage() {
  const life = useLifeState();
  const videoId = readVideoId();
  const library = useVideoLibrary({ apiOnline: life.apiOnline });
  const detail = useVideoDetail(videoId, life.apiOnline);

  const summaryFromList =
    videoId && library.payload
      ? library.payload.items.find((item) => item.id === videoId)
      : library.payload?.items[0];

  const activeVideo = detail ?? summaryFromList;

  return (
    <ModuleScreenLayout screenId="M-VID-DET" title="動画詳細" moduleLabel="動画">
      <section className="glass-card">
        {activeVideo ? (
          <>
            <p className="card-kicker">{kindLabel(activeVideo.kind)}</p>
            <h2 className="video-detail-title">{activeVideo.title}</h2>
            <p className="hint-line">{activeVideo.path}</p>
            <p className="metric-detail">
              {formatDuration(activeVideo.durationMin)} · {formatGb(activeVideo.sizeGb)} ·{' '}
              {activeVideo.resolution}
            </p>
            <p>{activeVideo.summary}</p>

            {detail ? (
              <>
                <p className="video-detail-meta">コーデック: {detail.codec}</p>
                {detail.capturedAt ? (
                  <p className="video-detail-meta">撮影: {detail.capturedAt}</p>
                ) : null}
                {detail.tags.length > 0 ? (
                  <ul className="video-tags">
                    {detail.tags.map((tag) => (
                      <li key={tag} className="video-tags__item">
                        {tag}
                      </li>
                    ))}
                  </ul>
                ) : null}
                <p className="video-storage-hint">{detail.storageHint}</p>
                {detail.relatedVolumeId ? (
                  <a href={storageDetailHref(detail.relatedVolumeId)} className="module-shortcuts__link">
                    関連ボリュームを見る
                  </a>
                ) : null}
              </>
            ) : (
              <p className="hint-line">詳細メタデータを取得中…</p>
            )}
          </>
        ) : (
          <p className="hint-line">動画を選択してください</p>
        )}
      </section>

      <section className="glass-card">
        <a href={screenHref('M-VID-LST')} className="module-shortcuts__link">
          ライブラリに戻る
        </a>
      </section>
    </ModuleScreenLayout>
  );
}
