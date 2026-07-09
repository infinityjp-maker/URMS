import { screenHref } from '../../app/appRoute.js';
import { useLifeState } from '../../hooks/useLifeState.js';
import { useStorageOverview } from '../../hooks/useStorageOverview.js';
import { formatGb } from './storage-ui.js';

export function StorageHubPreview() {
  const life = useLifeState();
  const storage = useStorageOverview({ apiOnline: life.apiOnline });
  const critical = storage.payload?.volumes.filter((volume) => volume.usagePct >= 70) ?? [];
  const topVolume = storage.payload?.volumes.reduce((max, volume) =>
    volume.usagePct > (max?.usagePct ?? 0) ? volume : max,
  );

  return (
    <a href={screenHref('M-STR-LST')} className="glass-card glass-card--link storage-hub">
      <p className="card-kicker">ストレージ · 一覧へ</p>
      {storage.loading ? (
        <p className="hint-line">容量を確認中…</p>
      ) : storage.payload ? (
        <>
          <p className="metric-detail">
            {formatGb(storage.payload.totalUsedGb)} / {formatGb(storage.payload.totalCapacityGb)} 使用
          </p>
          {critical.length > 0 ? (
            <p className="storage-hub__alert">注意 {critical.length} ボリューム — 最大 {topVolume?.usagePct ?? 0}%</p>
          ) : (
            <p className="hint-line">全ボリューム余裕あり</p>
          )}
          {topVolume ? (
            <p className="hint-line">
              {topVolume.name} · {topVolume.usagePct}%
            </p>
          ) : null}
        </>
      ) : (
        <p className="hint-line">ストレージ情報を取得できません</p>
      )}
    </a>
  );
}
