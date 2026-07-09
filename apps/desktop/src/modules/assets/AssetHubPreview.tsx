import { screenHref } from '../../app/appRoute.js';
import { useAssets } from '../../hooks/useAssets.js';
import { useLifeState } from '../../hooks/useLifeState.js';

export function AssetHubPreview() {
  const life = useLifeState();
  const assets = useAssets({ apiOnline: life.apiOnline });
  const pcParts = assets.payload?.assets.filter((asset) => asset.category === 'pc-part') ?? [];
  const topPart = pcParts[0];

  return (
    <a href={screenHref('M-AST-LST')} className="glass-card glass-card--link asset-hub">
      <p className="card-kicker">資産 · 一覧へ</p>
      {assets.loading ? (
        <p className="hint-line">資産を読み込み中…</p>
      ) : assets.payload ? (
        <>
          <p className="metric-detail">
            {assets.payload.assets.length} 件
            {assets.payload.source === 'catalog' ? ' · カタログ表示' : ''}
          </p>
          {topPart ? (
            <p className="hint-line">
              PC: {topPart.name}
              {topPart.budgetJpy ? ` · ${topPart.budgetJpy.toLocaleString('ja-JP')} 円` : ''}
            </p>
          ) : (
            <p className="hint-line">物理資産 · PC パーツ · 周辺機器</p>
          )}
          <span className="asset-hub__link">ロードマップ →</span>
        </>
      ) : (
        <p className="hint-line">資産一覧を取得できません</p>
      )}
    </a>
  );
}
