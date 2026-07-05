import { useCallback, useEffect, useState } from 'react';

import { ErrorBanner } from '../../components/ErrorBanner.js';
import { LoadingState } from '../../components/LoadingState.js';
import { getAuditLogs, type AuditLogItem } from '../../lib/api-client.js';
import { useMode } from '../mode/mode-context.js';

export function AuditLogPage() {
  const { mode } = useMode();
  const [items, setItems] = useState<AuditLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [resourceType, setResourceType] = useState('');
  const [actor, setActor] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getAuditLogs(mode, {
        resourceType: resourceType || undefined,
        actor: actor || undefined,
        page: '1',
        limit: '20',
      });
      setItems(response.data);
      setTotal(response.meta.total);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [actor, mode, resourceType]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section className="page-card">
      <h2>監査ログ</h2>

      <form
        className="filter-row"
        onSubmit={(event) => {
          event.preventDefault();
          void load();
        }}
      >
        <label>
          種別
          <input value={resourceType} onChange={(event) => setResourceType(event.target.value)} />
        </label>
        <label>
          操作者
          <input value={actor} onChange={(event) => setActor(event.target.value)} />
        </label>
        <button type="submit">検索</button>
      </form>

      {loading ? <LoadingState /> : null}
      {error ? <ErrorBanner error={error} onRetry={() => void load()} /> : null}

      {!loading && !error ? (
        <>
          <table className="data-table">
            <thead>
              <tr>
                <th>日時</th>
                <th>操作者</th>
                <th>アクション</th>
                <th>Resource</th>
                <th>Mode</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{new Date(item.createdAt).toLocaleString('ja-JP')}</td>
                  <td>{item.actorId}</td>
                  <td>{item.action}</td>
                  <td>
                    {item.resourceType && item.resourceId
                      ? `${item.resourceType}:${item.resourceId}`
                      : '—'}
                  </td>
                  <td>{item.mode}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="table-meta">全 {total} 件</p>
        </>
      ) : null}
    </section>
  );
}
