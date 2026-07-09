import { useEffect, useState } from 'react';

import type { OperationFlowDetail } from '@urms/shared';

import { fetchOperationsFlowDetail } from '../../api/client.js';
import { readOperationsFlowId, screenHref } from '../../app/appRoute.js';
import { useLifeState } from '../../hooks/useLifeState.js';
import { useMode } from '../../features/mode/mode-context.js';
import { ModuleScreenLayout } from '../ModuleScreenLayout.js';

function statusLabel(status: OperationFlowDetail['status']): string {
  if (status === 'error') return 'エラー';
  if (status === 'warn') return '警告';
  return '正常';
}

export function OperationsDetailPage() {
  const life = useLifeState();
  const { mode } = useMode();
  const flowId = readOperationsFlowId();
  const [flow, setFlow] = useState<OperationFlowDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!life.apiOnline || !flowId) {
      setLoading(false);
      setFlow(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    void fetchOperationsFlowDetail(mode, flowId).then((payload) => {
      if (cancelled) return;
      setFlow(payload?.flow ?? null);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [flowId, life.apiOnline, mode]);

  return (
    <ModuleScreenLayout screenId="M-OPS-DET" title="フロー詳細" moduleLabel="運用">
      <section className="glass-card">
        <p className="card-kicker">{flow?.name ?? 'フロー詳細'}</p>
        {!flowId ? (
          <p className="hint-line">フロー一覧から項目を選んでください。</p>
        ) : loading ? (
          <p className="hint-line">詳細を読み込み中…</p>
        ) : flow ? (
          <>
            <p className={`ops-flow__badge ops-flow__badge--${flow.status}`}>{statusLabel(flow.status)}</p>
            <p className="metric-large">{flow.summary}</p>
            <p className="hint-line">次のアクション: {flow.nextAction}</p>
            <ul className="ops-flow-checks">
              {flow.checks.map((check) => (
                <li key={check.label} className={`ops-flow-check ops-flow-check--${check.status}`}>
                  <span>{check.label}</span>
                  <strong>{check.detail}</strong>
                </li>
              ))}
            </ul>
            {flow.logs.length > 0 ? (
              <ul className="ops-flow-logs">
                {flow.logs.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            ) : null}
          </>
        ) : (
          <p className="hint-line">フロー詳細を取得できませんでした。</p>
        )}
      </section>

      <section className="glass-card">
        <a href={screenHref('M-OPS-LST')} className="module-shortcuts__link">
          フロー一覧に戻る
        </a>
      </section>
    </ModuleScreenLayout>
  );
}
