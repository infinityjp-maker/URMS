import type { OperationFlowStatus } from '@urms/shared';

import { operationsDetailHref, screenHref } from '../../app/appRoute.js';
import { useLifeState } from '../../hooks/useLifeState.js';
import { useOperationsFlows } from '../../hooks/useOperationsFlows.js';
import { ModuleScreenLayout } from '../ModuleScreenLayout.js';

function statusClass(status: OperationFlowStatus): string {
  return `ops-flow ops-flow--${status}`;
}

function statusLabel(status: OperationFlowStatus): string {
  if (status === 'error') return 'エラー';
  if (status === 'warn') return '警告';
  return '正常';
}

export function OperationsListPage() {
  const life = useLifeState();
  const operations = useOperationsFlows({ apiOnline: life.apiOnline });

  return (
    <ModuleScreenLayout screenId="M-OPS-LST" title="フロー一覧" moduleLabel="運用">
      <section className="glass-card">
        <p className="card-kicker">運用フロー</p>
        {operations.loading ? (
          <p className="hint-line">フロー状態を取得中…</p>
        ) : operations.payload ? (
          <>
            <p className="metric-detail">
              監視 {operations.payload.flows.length} 件 · 注意 {operations.payload.alertCount} 件
            </p>
            <ul className="ops-flow-list">
              {operations.payload.flows.map((flow) => (
                <li key={flow.id}>
                  <a href={operationsDetailHref(flow.id)} className={statusClass(flow.status)}>
                    <span className="ops-flow__name">{flow.name}</span>
                    <span className="ops-flow__badge">{statusLabel(flow.status)}</span>
                    <span className="ops-flow__summary">{flow.summary}</span>
                  </a>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="hint-line">
            {operations.error
              ? 'API 未起動 — start-dev-servers.bat で起動してください'
              : 'フロー一覧を取得できません'}
          </p>
        )}
      </section>
    </ModuleScreenLayout>
  );
}
