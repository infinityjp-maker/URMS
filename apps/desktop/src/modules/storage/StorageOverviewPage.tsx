import { storageDetailHref } from '../../app/appRoute.js';
import { useLifeState } from '../../hooks/useLifeState.js';
import { useStorageOverview } from '../../hooks/useStorageOverview.js';
import { ModuleScreenLayout } from '../ModuleScreenLayout.js';
import { formatGb, kindLabel, usageClass } from './storage-ui.js';

export function StorageOverviewPage() {
  const life = useLifeState();
  const storage = useStorageOverview({ apiOnline: life.apiOnline });

  return (
    <ModuleScreenLayout screenId="M-STR-LST" title="ストレージ" moduleLabel="ストレージ">
      <section className="glass-card">
        <p className="card-kicker">容量 · 分布</p>
        {storage.loading ? (
          <p className="hint-line">ストレージ情報を取得中…</p>
        ) : storage.payload ? (
          <>
            <p className="metric-detail">
              合計 {formatGb(storage.payload.totalUsedGb)} / {formatGb(storage.payload.totalCapacityGb)} 使用
              {storage.payload.source === 'catalog' ? ' · カタログ表示' : ''}
            </p>
            <ul className="storage-volume-list">
              {storage.payload.volumes.map((volume) => (
                <li key={volume.id}>
                  <a href={storageDetailHref(volume.id)} className="storage-volume-list__link">
                    <div className="storage-volume-list__header">
                      <span className="storage-volume-list__name">{volume.name}</span>
                      <span className="storage-volume-list__kind">{kindLabel(volume.kind)}</span>
                    </div>
                    <div className={usageClass(volume.usagePct)}>
                      <div
                        className="storage-usage__bar"
                        style={{ width: `${volume.usagePct}%` }}
                      />
                    </div>
                    <p className="storage-volume-list__meta">
                      {volume.usagePct}% · 空き {formatGb(volume.freeGb)} · {volume.path}
                    </p>
                    <p className="storage-volume-list__summary">{volume.summary}</p>
                  </a>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="hint-line">
            {storage.error
              ? 'API 未起動 — start-dev-servers.bat で起動してください'
              : 'ストレージ情報を取得できません'}
          </p>
        )}
      </section>
    </ModuleScreenLayout>
  );
}
