import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import type { ResourceEntity, ResourceStatus } from '@urms/shared';
import { RESOURCE_STATUSES } from '@urms/shared';

import { ErrorBanner } from '../../components/ErrorBanner.js';
import { LoadingState } from '../../components/LoadingState.js';
import { changeResourceLifecycle, getResource } from '../../lib/api-client.js';
import { useMode } from '../mode/mode-context.js';
import { canShowResourceWrite } from '../mode/mode-ui.js';

export function ResourceDetailPage() {
  const { mode } = useMode();
  const params = useParams();
  const resourceType = params.type ?? '';
  const resourceId = params.id ?? '';
  const [resource, setResource] = useState<ResourceEntity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [lifecycleStatus, setLifecycleStatus] = useState<ResourceStatus>('active');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getResource(mode, resourceType, resourceId);
      setResource(response.data);
      setLifecycleStatus(response.data.status);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [mode, resourceId, resourceType]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleLifecycleChange() {
    if (!resource) return;

    try {
      const response = await changeResourceLifecycle(mode, resource.resourceType, resource.resourceId, lifecycleStatus);
      setResource(response.data);
    } catch (err) {
      setError(err);
    }
  }

  return (
    <section className="page-card">
      <Link className="back-link" to="/resources">
        ← 一覧に戻る
      </Link>

      {loading ? <LoadingState /> : null}
      {error ? <ErrorBanner error={error} onRetry={() => void load()} /> : null}

      {resource ? (
        <>
          <div className="page-header">
            <div>
              <h2>
                {resource.resourceType} : {resource.resourceId}
              </h2>
              <p className="subtle">状態: {resource.status}</p>
            </div>
            {canShowResourceWrite(mode) ? (
              <div className="button-row">
                <Link className="button" to={`/resources/${resource.resourceType}/${resource.resourceId}/edit`}>
                  編集
                </Link>
                <label className="inline-field">
                  ライフサイクル
                  <select
                    value={lifecycleStatus}
                    onChange={(event) => setLifecycleStatus(event.target.value as ResourceStatus)}
                  >
                    {RESOURCE_STATUSES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
                <button type="button" className="button" onClick={() => void handleLifecycleChange()}>
                  変更
                </button>
              </div>
            ) : null}
          </div>

          <dl className="detail-list">
            <dt>名称</dt>
            <dd>{resource.name}</dd>
            <dt>種別</dt>
            <dd>{resource.resourceType}</dd>
            <dt>ID</dt>
            <dd>{resource.resourceId}</dd>
            <dt>更新日</dt>
            <dd>{new Date(resource.updatedAt).toLocaleString('ja-JP')}</dd>
          </dl>

          <h3>metadata</h3>
          <pre className="json-block">{JSON.stringify(resource.metadata, null, 2)}</pre>
        </>
      ) : null}
    </section>
  );
}
