import { useCallback, useEffect, useState } from 'react';

import {
  fetchIntegrationHealth,
  fetchIntegrations,
  syncIntegration,
  exportIntegration,
  type IntegrationHealth,
  type IntegrationSummary,
} from '../../api/client.js';
import { useMode } from '../mode/mode-context.js';
import { canShowIntegrationsNav } from '../mode/mode-ui.js';
import { formatExportResultMessage } from './export-result-message.js';

type IntegrationRow = IntegrationSummary & {
  health?: IntegrationHealth;
  syncing?: boolean;
  exporting?: boolean;
  message?: string;
};

export function DevelopPanel() {
  const { mode } = useMode();
  const [items, setItems] = useState<IntegrationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    const response = await fetchIntegrations(mode);
    if (!response.ok) {
      setError(response.error ?? '連携一覧の取得に失敗しました');
      setItems([]);
      setLoading(false);
      return;
    }

    setItems(response.data);
    setLoading(false);
  }, [mode]);

  useEffect(() => {
    if (!canShowIntegrationsNav(mode)) {
      setItems([]);
      setLoading(false);
      setError(null);
      return;
    }

    void load();
  }, [load, mode]);

  if (!canShowIntegrationsNav(mode)) {
    return null;
  }

  async function handleHealthCheck(integrationId: string): Promise<void> {
    const response = await fetchIntegrationHealth(mode, integrationId);
    if (!response.ok) {
      setItems((current) =>
        current.map((item) =>
          item.integrationId === integrationId
            ? { ...item, message: response.error ?? 'ヘルスチェックに失敗しました' }
            : item,
        ),
      );
      return;
    }

    setItems((current) =>
      current.map((item) =>
        item.integrationId === integrationId
          ? { ...item, health: response.data, message: undefined }
          : item,
      ),
    );
  }

  async function handleSync(integrationId: string): Promise<void> {
    setItems((current) =>
      current.map((item) =>
        item.integrationId === integrationId ? { ...item, syncing: true, message: undefined } : item,
      ),
    );

    const response = await syncIntegration(mode, integrationId);
    setItems((current) =>
      current.map((item) =>
        item.integrationId === integrationId
          ? {
              ...item,
              syncing: false,
              message: response.ok ? '同期完了' : (response.error ?? '同期に失敗しました'),
            }
          : item,
      ),
    );
  }

  async function handleExport(integrationId: string): Promise<void> {
    setItems((current) =>
      current.map((item) =>
        item.integrationId === integrationId ? { ...item, exporting: true, message: undefined } : item,
      ),
    );

    const response = await exportIntegration(mode, integrationId);
    setItems((current) =>
      current.map((item) =>
        item.integrationId === integrationId
          ? {
              ...item,
              exporting: false,
              message: response.ok
                ? formatExportResultMessage(response.data)
                : (response.error ?? '書戻しに失敗しました'),
            }
          : item,
      ),
    );
  }

  return (
    <div className="glass-card develop-panel" aria-label="外部連携">
      <p className="card-kicker">外部連携（develop）</p>
      <p className="hint-line">Cursor / AI Team 同期 · flag + develop Mode</p>

      {loading ? <p className="hint-line">読み込み中…</p> : null}
      {error ? <p className="hint-line develop-panel__error">{error}</p> : null}

      {!loading && !error
        ? items.map((item) => (
            <div key={item.integrationId} className="develop-panel__row">
              <div className="develop-panel__meta">
                <span className="develop-panel__name">{item.name}</span>
                <span className="hint-line">
                  <code>{item.integrationId}</code>
                  {item.health
                    ? ` · ${item.health.healthy ? 'OK' : 'NG'} — ${item.health.detail}`
                    : null}
                </span>
                {item.message ? <span className="hint-line develop-panel__message">{item.message}</span> : null}
              </div>
              <div className="develop-panel__actions">
                <button type="button" className="develop-panel__button" onClick={() => void handleHealthCheck(item.integrationId)}>
                  ヘルス
                </button>
                {item.syncSupported ? (
                  <button
                    type="button"
                    className="develop-panel__button"
                    disabled={item.syncing}
                    onClick={() => void handleSync(item.integrationId)}
                  >
                    {item.syncing ? '同期中…' : '同期'}
                  </button>
                ) : null}
                {item.exportSupported ? (
                  <button
                    type="button"
                    className="develop-panel__button"
                    disabled={item.exporting}
                    onClick={() => void handleExport(item.integrationId)}
                  >
                    {item.exporting ? '書戻し中…' : '書戻し'}
                  </button>
                ) : null}
              </div>
            </div>
          ))
        : null}
    </div>
  );
}
