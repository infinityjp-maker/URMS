import { assetPcHref, pcPartsHref } from '../../app/appRoute.js';
import { useLifeState } from '../../hooks/useLifeState.js';
import { useAssets } from '../../hooks/useAssets.js';
import { ModuleScreenLayout } from '../ModuleScreenLayout.js';

function categoryLabel(category: string): string {
  if (category === 'pc-part') return 'PC パーツ';
  if (category === 'peripheral') return '周辺機器';
  return 'その他';
}

function formatBudget(value: number | undefined): string {
  if (value === undefined) return '—';
  return `${value.toLocaleString('ja-JP')} 円`;
}

export function AssetListPage() {
  const life = useLifeState();
  const assets = useAssets({ apiOnline: life.apiOnline });

  return (
    <ModuleScreenLayout screenId="M-AST-LST" title="資産一覧" moduleLabel="資産">
      <section className="glass-card">
        <p className="card-kicker">物理資産</p>
        {assets.loading ? (
          <p className="hint-line">資産一覧を取得中…</p>
        ) : assets.payload ? (
          <>
            <p className="metric-detail">
              {assets.payload.assets.length} 件 · データ源:{' '}
              {assets.payload.source === 'resource' ? 'Resource DB' : 'カタログ（初期表示）'}
            </p>
            <ul className="asset-list">
              {assets.payload.assets.map((asset) => (
                <li key={asset.id}>
                  <a href={assetPcHref(asset.id)} className="asset-list__link">
                    <span className="asset-list__name">{asset.name}</span>
                    <span className="asset-list__meta">
                      {categoryLabel(asset.category)} · {asset.location}
                    </span>
                    <span className="asset-list__summary">{asset.summary}</span>
                    <span className="asset-list__budget">{formatBudget(asset.budgetJpy)}</span>
                  </a>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="hint-line">
            {assets.error
              ? 'API 未起動 — start-dev-servers.bat で起動してください'
              : '資産一覧を取得できません'}
          </p>
        )}
      </section>

      <section className="glass-card">
        <a href={pcPartsHref()} className="module-shortcuts__link">
          PC パーツ · ロードマップを見る
        </a>
      </section>
    </ModuleScreenLayout>
  );
}
