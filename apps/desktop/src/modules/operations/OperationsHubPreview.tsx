import type { OperationFlowStatus } from '@urms/shared';

import { operationsDetailHref, screenHref } from '../../app/appRoute.js';
import { useLifeState } from '../../hooks/useLifeState.js';
import { useOperationsFlows } from '../../hooks/useOperationsFlows.js';

function worstStatus(flows: Array<{ status: OperationFlowStatus }>): OperationFlowStatus {
  if (flows.some((flow) => flow.status === 'error')) return 'error';
  if (flows.some((flow) => flow.status === 'warn')) return 'warn';
  return 'ok';
}

export function OperationsHubPreview() {
  const life = useLifeState();
  const operations = useOperationsFlows({ apiOnline: life.apiOnline });
  const flows = operations.payload?.flows ?? [];
  const alerts = flows.filter((flow) => flow.status !== 'ok');
  const overall = worstStatus(flows);

  return (
    <a href={screenHref('M-OPS-LST')} className="glass-card glass-card--link ops-hub">
      <p className="card-kicker">運用 · フロー一覧へ</p>
      {operations.loading ? (
        <p className="hint-line">運用状態を確認中…</p>
      ) : operations.payload ? (
        <>
          <p className={`ops-flow__badge ops-flow__badge--${overall}`}>
            {alerts.length === 0 ? 'すべて正常' : `注意 ${alerts.length} 件`}
          </p>
          {alerts.length > 0 ? (
            <ul className="ops-hub__alerts">
              {alerts.slice(0, 2).map((flow) => (
                <li key={flow.id}>
                  <a href={operationsDetailHref(flow.id)} className="ops-hub__alert-link">
                    {flow.name} — {flow.summary}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="hint-line">API · DB · 天気 · 予定 · 交通 · 連携を監視中</p>
          )}
        </>
      ) : (
        <p className="hint-line">運用フローを取得できません</p>
      )}
    </a>
  );
}
