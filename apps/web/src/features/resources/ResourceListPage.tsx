import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import type { ResourceEntity } from '@urms/shared';
import { RESOURCE_STATUSES } from '@urms/shared';

import { ErrorBanner } from '../../components/ErrorBanner.js';
import { LoadingState } from '../../components/LoadingState.js';
import { useMode } from '../mode/mode-context.js';
import { canShowResourceWrite } from '../mode/mode-ui.js';
import { getResources } from '../../lib/api-client.js';

export function ResourceListPage() {
  const { mode } = useMode();
  const [items, setItems] = useState<ResourceEntity[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getResources(mode, {
        type: type || undefined,
        status: status || undefined,
        q: q || undefined,
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
  }, [mode, q, status, type]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section className="page-card">
      <div className="page-header">
        <h2>Resource 一覧</h2>
        {canShowResourceWrite(mode) ? (
          <Link className="button primary" to="/resources/new">
            + 新規作成
          </Link>
        ) : null}
      </div>

      <form
        className="filter-row"
        onSubmit={(event) => {
          event.preventDefault();
          void load();
        }}
      >
        <label>
          種別
          <input value={type} onChange={(event) => setType(event.target.value)} placeholder="physical" />
        </label>
        <label>
          状態
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">すべて</option>
            {RESOURCE_STATUSES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label>
          検索
          <input value={q} onChange={(event) => setQ(event.target.value)} placeholder="名称" />
        </label>
        <button type="submit">検索</button>
      </form>

      {loading ? <LoadingState /> : null}
      {error ? <ErrorBanner error={error} onRetry={() => void load()} /> : null}

      {!loading && !error && items.length === 0 ? (
        <div className="empty-state">
          <p>Resource がありません</p>
          {canShowResourceWrite(mode) ? (
            <Link className="button primary" to="/resources/new">
              + 新規作成
            </Link>
          ) : null}
        </div>
      ) : null}

      {!loading && !error && items.length > 0 ? (
        <>
          <table className="data-table">
            <thead>
              <tr>
                <th>種別</th>
                <th>ID</th>
                <th>名称</th>
                <th>状態</th>
                <th>更新日</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={`${item.resourceType}:${item.resourceId}`}>
                  <td>{item.resourceType}</td>
                  <td>
                    <Link to={`/resources/${item.resourceType}/${item.resourceId}`}>{item.resourceId}</Link>
                  </td>
                  <td>{item.name}</td>
                  <td>{item.status}</td>
                  <td>{new Date(item.updatedAt).toLocaleString('ja-JP')}</td>
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
