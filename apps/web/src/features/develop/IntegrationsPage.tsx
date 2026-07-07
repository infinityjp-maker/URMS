import { useCallback, useEffect, useState } from 'react';

import {
  ApiClientError,
  getIntegrationHealth,
  getIntegrations,
  syncIntegration,
  exportIntegration,
  type IntegrationHealth,
  type IntegrationSummary,
} from '../../lib/api-client.js';
import { useMode } from '../mode/mode-context.js';
import { canShowIntegrationsNav } from '../mode/mode-ui.js';

type IntegrationRow = IntegrationSummary & {
  health?: IntegrationHealth;
  syncing?: boolean;
  exporting?: boolean;
  message?: string;
};

export function IntegrationsPage() {
  const { mode } = useMode();
  const [items, setItems] = useState<IntegrationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getIntegrations(mode);
      setItems(response.data);
    } catch (cause) {
      const message = cause instanceof ApiClientError ? cause.message : '連携一覧の取得に失敗しました';
      setError(message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [mode]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!canShowIntegrationsNav(mode)) {
    return (
      <section className="page-card">
        <h2>外部連携</h2>
        <p className="subtle">Integration sync は develop Mode のみ利用できます。</p>
      </section>
    );
  }

  async function handleHealthCheck(integrationId: string): Promise<void> {
    try {
      const response = await getIntegrationHealth(mode, integrationId);
      setItems((current) =>
        current.map((item) =>
          item.integrationId === integrationId
            ? { ...item, health: response.data, message: undefined }
            : item,
        ),
      );
    } catch (cause) {
      const message = cause instanceof ApiClientError ? cause.message : 'ヘルスチェックに失敗しました';
      setItems((current) =>
        current.map((item) =>
          item.integrationId === integrationId ? { ...item, message } : item,
        ),
      );
    }
  }

  async function handleSync(integrationId: string): Promise<void> {
    setItems((current) =>
      current.map((item) =>
        item.integrationId === integrationId ? { ...item, syncing: true, message: undefined } : item,
      ),
    );

    try {
      await syncIntegration(mode, integrationId);
      setItems((current) =>
        current.map((item) =>
          item.integrationId === integrationId
            ? { ...item, syncing: false, message: '同期完了' }
            : item,
        ),
      );
    } catch (cause) {
      const message = cause instanceof ApiClientError ? cause.message : '同期に失敗しました';
      setItems((current) =>
        current.map((item) =>
          item.integrationId === integrationId ? { ...item, syncing: false, message } : item,
        ),
      );
    }
  }

  async function handleExport(integrationId: string): Promise<void> {
    setItems((current) =>
      current.map((item) =>
        item.integrationId === integrationId ? { ...item, exporting: true, message: undefined } : item,
      ),
    );

    try {
      await exportIntegration(mode, integrationId);
      setItems((current) =>
        current.map((item) =>
          item.integrationId === integrationId
            ? { ...item, exporting: false, message: '書戻し完了' }
            : item,
        ),
      );
    } catch (cause) {
      const message = cause instanceof ApiClientError ? cause.message : '書戻しに失敗しました';
      setItems((current) =>
        current.map((item) =>
          item.integrationId === integrationId ? { ...item, exporting: false, message } : item,
        ),
      );
    }
  }

  return (
    <section className="page-card">
      <h2>外部連携（develop）</h2>
      <p className="subtle">
        UC-012 — AI Team / Cursor ワークスペース同期。develop Mode +{' '}
        <code>URMS_FF_DEVELOP_ENABLED=true</code> が必要です。
      </p>

      {loading ? <p className="subtle">読み込み中…</p> : null}
      {error ? <p className="subtle">{error}</p> : null}

      {!loading && !error ? (
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>名称</th>
              <th>sync</th>
              <th>export</th>
              <th>状態</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.integrationId}>
                <td>
                  <code>{item.integrationId}</code>
                </td>
                <td>{item.name}</td>
                <td>{item.syncSupported ? '対応' : '—'}</td>
                <td>{item.exportSupported ? '対応' : '—'}</td>
                <td>
                  {item.health ? (
                    <span>{item.health.healthy ? 'OK' : 'NG'} — {item.health.detail}</span>
                  ) : (
                    '—'
                  )}
                  {item.message ? <div className="subtle">{item.message}</div> : null}
                </td>
                <td>
                  <button type="button" className="button" onClick={() => void handleHealthCheck(item.integrationId)}>
                    ヘルス
                  </button>
                  {item.syncSupported ? (
                    <button
                      type="button"
                      className="button"
                      disabled={item.syncing}
                      onClick={() => void handleSync(item.integrationId)}
                    >
                      {item.syncing ? '同期中…' : '同期'}
                    </button>
                  ) : null}
                  {item.exportSupported ? (
                    <button
                      type="button"
                      className="button"
                      disabled={item.exporting}
                      onClick={() => void handleExport(item.integrationId)}
                    >
                      {item.exporting ? '書戻し中…' : '書戻し'}
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </section>
  );
}
