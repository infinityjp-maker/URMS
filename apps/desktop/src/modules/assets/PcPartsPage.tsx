import { readAssetId, screenHref } from '../../app/appRoute.js';
import { useAssetDetail, usePcParts } from '../../hooks/useAssets.js';
import { useLifeState } from '../../hooks/useLifeState.js';
import { ModuleScreenLayout } from '../ModuleScreenLayout.js';

function partTypeLabel(partType: string | undefined): string {
  if (partType === 'cpu') return 'CPU';
  if (partType === 'gpu') return 'GPU';
  if (partType === 'ram') return 'RAM';
  if (partType === 'storage') return 'ストレージ';
  if (partType === 'motherboard') return 'マザーボード';
  if (partType === 'psu') return '電源';
  return 'パーツ';
}

function formatBudget(value: number | undefined): string {
  if (value === undefined) return '—';
  return `${value.toLocaleString('ja-JP')} 円`;
}

export function PcPartsPage() {
  const life = useLifeState();
  const selectedId = readAssetId();
  const pcParts = usePcParts({ apiOnline: life.apiOnline });
  const detail = useAssetDetail(selectedId, life.apiOnline);
  const selectedSummary =
    selectedId && pcParts.payload
      ? pcParts.payload.parts.find((part) => part.id === selectedId)
      : undefined;
  const activePart = detail ?? selectedSummary ?? pcParts.payload?.parts[0] ?? null;

  return (
    <ModuleScreenLayout screenId="M-AST-PC" title="PC パーツ" moduleLabel="資産">
      <section className="glass-card asset-pc-layout">
        <div className="asset-pc-layout__sidebar">
          <p className="card-kicker">PC パーツ</p>
          {pcParts.loading ? (
            <p className="hint-line">パーツ一覧を読み込み中…</p>
          ) : pcParts.payload ? (
            <>
              <p className="metric-detail">
                合計 {formatBudget(pcParts.payload.totalBudgetJpy)} · {pcParts.payload.parts.length} 件
              </p>
              <ul className="asset-list asset-list--compact">
                {pcParts.payload.parts.map((part) => (
                  <li key={part.id}>
                    <a
                      href={pcPartsHref(part.id)}
                      className={`asset-list__link${part.id === selectedId ? ' asset-list__link--active' : ''}`}
                    >
                      <span className="asset-list__name">{part.name}</span>
                      <span className="asset-list__meta">{partTypeLabel(part.partType)}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="hint-line">パーツ一覧を取得できません</p>
          )}
        </div>

        <div className="asset-pc-layout__content">
          {activePart ? (
            <>
              <p className="card-kicker">{partTypeLabel(activePart.partType)}</p>
              <h2 className="asset-detail-title">{activePart.name}</h2>
              <p className="hint-line">
                {activePart.location} · {activePart.assetTag ?? activePart.id}
              </p>
              <p>{activePart.summary}</p>
              {detail?.notes ? <p className="hint-line">{detail.notes}</p> : null}
              {detail?.purchasedAt ? <p className="hint-line">購入日: {detail.purchasedAt}</p> : null}
              {detail?.roadmapNote ? <p className="hint-line">{detail.roadmapNote}</p> : null}
              <p className="asset-detail-budget">予算/取得価格: {formatBudget(activePart.budgetJpy)}</p>
            </>
          ) : (
            <p className="hint-line">左のリストからパーツを選択してください</p>
          )}

          {pcParts.payload ? (
            <div className="asset-roadmap">
              <h3 className="asset-roadmap__title">アップグレードロードマップ</h3>
              <ul className="asset-roadmap__list">
                {pcParts.payload.roadmap.map((item) => (
                  <li key={item.phase} className="asset-roadmap__item">
                    <span className="asset-roadmap__phase">{item.phase}</span>
                    <span className="asset-roadmap__name">{item.title}</span>
                    <span className="asset-roadmap__detail">{item.detail}</span>
                    {item.estimatedJpy !== undefined ? (
                      <span className="asset-roadmap__budget">{formatBudget(item.estimatedJpy)}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </section>

      <section className="glass-card">
        <a href={screenHref('M-AST-LST')} className="module-shortcuts__link">
          資産一覧に戻る
        </a>
      </section>
    </ModuleScreenLayout>
  );
}
