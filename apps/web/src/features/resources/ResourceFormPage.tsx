import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { ErrorBanner } from '../../components/ErrorBanner.js';
import { LoadingState } from '../../components/LoadingState.js';
import { createResource, getResource, updateResource } from '../../lib/api-client.js';
import { useMode } from '../mode/mode-context.js';

interface ResourceFormPageProps {
  mode: 'create' | 'edit';
}

export function ResourceFormPage({ mode: formMode }: ResourceFormPageProps) {
  const { mode } = useMode();
  const navigate = useNavigate();
  const params = useParams();
  const resourceTypeParam = params.type ?? '';
  const resourceIdParam = params.id ?? '';

  const [resourceType, setResourceType] = useState(formMode === 'create' ? '' : resourceTypeParam);
  const [resourceId, setResourceId] = useState(formMode === 'create' ? '' : resourceIdParam);
  const [name, setName] = useState('');
  const [metadataText, setMetadataText] = useState('{}');
  const [loading, setLoading] = useState(formMode === 'edit');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (formMode !== 'edit') return;

    void (async () => {
      try {
        const response = await getResource(mode, resourceTypeParam, resourceIdParam);
        setName(response.data.name);
        setMetadataText(JSON.stringify(response.data.metadata, null, 2));
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [formMode, mode, resourceIdParam, resourceTypeParam]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    let metadata: Record<string, unknown> = {};
    try {
      metadata = JSON.parse(metadataText) as Record<string, unknown>;
    } catch {
      setError(new Error('metadata は有効な JSON である必要があります'));
      setSubmitting(false);
      return;
    }

    try {
      if (formMode === 'create') {
        const response = await createResource(mode, { resourceType, resourceId, name, metadata });
        setSuccess('Resource を作成しました');
        navigate(`/resources/${response.data.resourceType}/${response.data.resourceId}`);
        return;
      }

      const response = await updateResource(mode, resourceTypeParam, resourceIdParam, { name, metadata });
      setSuccess('Resource を更新しました');
      navigate(`/resources/${response.data.resourceType}/${response.data.resourceId}`);
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="page-card">
      <Link className="back-link" to={formMode === 'create' ? '/resources' : `/resources/${resourceTypeParam}/${resourceIdParam}`}>
        ← 戻る
      </Link>

      <h2>{formMode === 'create' ? '新規 Resource 作成' : 'Resource 編集'}</h2>

      {loading ? <LoadingState /> : null}
      {error ? <ErrorBanner error={error} /> : null}
      {success ? <p className="success-banner">{success}</p> : null}

      {!loading ? (
        <form className="form-grid" onSubmit={(event) => void handleSubmit(event)}>
          <label>
            種別 (resourceType) *
            <input
              value={resourceType}
              onChange={(event) => setResourceType(event.target.value)}
              readOnly={formMode === 'edit'}
              required
            />
          </label>
          <label>
            ID (resourceId) *
            <input
              value={resourceId}
              onChange={(event) => setResourceId(event.target.value)}
              readOnly={formMode === 'edit'}
              required
            />
          </label>
          <label>
            名称 (name) *
            <input value={name} onChange={(event) => setName(event.target.value)} required />
          </label>
          <label className="full-width">
            metadata (JSON)
            <textarea value={metadataText} onChange={(event) => setMetadataText(event.target.value)} rows={8} />
          </label>
          <div className="button-row full-width">
            <button type="submit" className="button primary" disabled={submitting}>
              {formMode === 'create' ? '作成' : '保存'}
            </button>
          </div>
        </form>
      ) : null}
    </section>
  );
}
