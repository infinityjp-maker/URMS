import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import type { ContextDashboard } from '@urms/shared';

import { ErrorBanner } from '../../components/ErrorBanner.js';
import { LoadingState } from '../../components/LoadingState.js';
import { getContextDashboard } from '../../lib/api-client.js';
import { useMode } from '../mode/mode-context.js';
import { canShowContextNav } from '../mode/mode-ui.js';

function findSummary(dashboard: ContextDashboard, key: string): string {
  return dashboard.items.find((item) => item.key === key)?.summary ?? '—';
}

export function DashboardPage() {
  const { mode } = useMode();
  const [dashboard, setDashboard] = useState<ContextDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getContextDashboard(mode);
      setDashboard(response.data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [mode]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <LoadingState label="ダッシュボードを読み込み中..." />;
  }

  return (
    <section className="page-card" aria-label="ダッシュボード">
      <h2>ダッシュボード</h2>

      {error ? <ErrorBanner error={error} onRetry={() => void load()} /> : null}

      {dashboard ? (
        <>
          <div className="info-grid">
            <article className="info-card">
              <h3>現在フェーズ</h3>
              <p>{findSummary(dashboard, 'current_phase')}</p>
            </article>
            <article className="info-card">
              <h3>現在タスク</h3>
              <p>{findSummary(dashboard, 'current_task')}</p>
            </article>
            <article className="info-card">
              <h3>プロジェクト状態</h3>
              <p>{findSummary(dashboard, 'project_status')}</p>
            </article>
          </div>
          <p className="hint">
            運用 Mode で Resource 管理、監査 Mode で監査ログを参照できます。
            {canShowContextNav(mode) ? (
              <>
                {' '}
                <Link to="/context">Context ダッシュボード</Link> で詳細を確認できます。
              </>
            ) : null}
          </p>
        </>
      ) : null}
    </section>
  );
}
