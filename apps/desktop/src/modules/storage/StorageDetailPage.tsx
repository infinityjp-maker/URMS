import { readStorageVolumeId, screenHref } from '../../app/appRoute.js';
import { useLifeState } from '../../hooks/useLifeState.js';
import { useStorageOverview, useStorageVolume } from '../../hooks/useStorageOverview.js';
import { ModuleScreenLayout } from '../ModuleScreenLayout.js';
import { formatGb, kindLabel, usageClass } from './storage-ui.js';

export function StorageDetailPage() {
  const life = useLifeState();
  const volumeId = readStorageVolumeId();
  const storage = useStorageOverview({ apiOnline: life.apiOnline });
  const detail = useStorageVolume(volumeId, life.apiOnline);

  const activeVolume =
    detail ??
    (volumeId && storage.payload
      ? storage.payload.volumes.find((volume) => volume.id === volumeId)
      : storage.payload?.volumes[0]);

  return (
    <ModuleScreenLayout screenId="M-STR-DET" title="ボリューム詳細" moduleLabel="ストレージ">
      <section className="glass-card">
        {activeVolume ? (
          <>
            <p className="card-kicker">{kindLabel(activeVolume.kind)}</p>
            <h2 className="storage-detail-title">{activeVolume.name}</h2>
            <p className="hint-line">{activeVolume.path}</p>
            <div className={usageClass(activeVolume.usagePct)}>
              <div
                className="storage-usage__bar"
                style={{ width: `${activeVolume.usagePct}%` }}
              />
            </div>
            <p className="metric-detail">
              {formatGb(activeVolume.usedGb)} / {formatGb(activeVolume.totalGb)} · 空き{' '}
              {formatGb(activeVolume.freeGb)}
            </p>
            <p>{activeVolume.summary}</p>

            {detail?.largestItems && detail.largestItems.length > 0 ? (
              <div className="storage-large-items">
                <h3 className="storage-large-items__title">大きい項目</h3>
                <ul>
                  {detail.largestItems.map((item) => (
                    <li key={item.label} className="storage-large-items__row">
                      <span>{item.label}</span>
                      <span>{formatGb(item.sizeGb)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {detail?.cleanupHint ? (
              <p className="storage-cleanup-hint">{detail.cleanupHint}</p>
            ) : null}
          </>
        ) : (
          <p className="hint-line">ボリュームを選択してください</p>
        )}
      </section>

      <section className="glass-card">
        <a href={screenHref('M-STR-LST')} className="module-shortcuts__link">
          ストレージ一覧に戻る
        </a>
      </section>
    </ModuleScreenLayout>
  );
}
