import { useCallback, useEffect, useState } from 'react';

import {
  CONTEXT_SUMMARY_MAX_LENGTH,
  EDITABLE_CONTEXT_KEYS,
  type ContextDashboard,
  type ContextSnapshotItem,
  type ContextUpdateItem,
  type EditableContextKey,
} from '@urms/shared';

import { ErrorBanner } from '../../components/ErrorBanner.js';
import { LoadingState } from '../../components/LoadingState.js';
import { getContextDashboard, updateContextDashboard } from '../../lib/api-client.js';
import { useMode } from '../mode/mode-context.js';
import { canEditContext, getModeLabel } from '../mode/mode-ui.js';

const KEY_LABELS: Record<EditableContextKey, string> = {
  current_phase: 'current_phase',
  current_task: 'current_task',
  next_task: 'next_task',
  project_status: 'project_status',
  ssot_links: 'ssot_links',
};

function toDraftItems(items: ContextSnapshotItem[]): Record<EditableContextKey, string> {
  const draft = {} as Record<EditableContextKey, string>;

  for (const key of EDITABLE_CONTEXT_KEYS) {
    draft[key] = items.find((item) => item.key === key)?.summary ?? '';
  }

  return draft;
}

export function ContextPage() {
  const { mode } = useMode();
  const editable = canEditContext(mode);
  const [dashboard, setDashboard] = useState<ContextDashboard | null>(null);
  const [draft, setDraft] = useState<Record<EditableContextKey, string> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getContextDashboard(mode);
      setDashboard(response.data);
      setDraft(toDraftItems(response.data.items));
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [mode]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft || !editable) {
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const items: ContextUpdateItem[] = EDITABLE_CONTEXT_KEYS.map((key) => ({
        key,
        summary: draft[key],
        ssotLinks: dashboard?.items.find((item) => item.key === key)?.ssotLinks ?? [],
      }));

      const response = await updateContextDashboard(mode, items);
      setDashboard(response.data);
      setDraft(toDraftItems(response.data.items));
      setSuccess('Context を保存しました');
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <LoadingState label="Context を読み込み中..." />;
  }

  return (
    <section className="page-card">
      <div className="page-header">
        <h2>Context ダッシュボード</h2>
        <span className="badge">{getModeLabel(mode)}</span>
      </div>

      <p className="subtle">
        要約 + SSOT リンクのみ（本文複製禁止）。更新は plan Mode のみ。
      </p>

      {error ? <ErrorBanner error={error} onRetry={() => void load()} /> : null}
      {success ? <p className="success-banner">{success}</p> : null}

      {editable && draft ? (
        <form className="context-form" onSubmit={(event) => void handleSave(event)}>
          {EDITABLE_CONTEXT_KEYS.map((key) => (
            <label key={key} className="field-block">
              <span>{KEY_LABELS[key]}</span>
              <input
                value={draft[key]}
                maxLength={CONTEXT_SUMMARY_MAX_LENGTH}
                onChange={(event) =>
                  setDraft((current) =>
                    current ? { ...current, [key]: event.target.value } : current,
                  )
                }
              />
              <span className="hint">
                {draft[key].length}/{CONTEXT_SUMMARY_MAX_LENGTH}
              </span>
            </label>
          ))}
          <button className="button primary" type="submit" disabled={saving}>
            {saving ? '保存中...' : '保存'}
          </button>
        </form>
      ) : null}

      <div className="info-grid">
        {dashboard?.items.map((item) => (
          <article key={item.key} className="info-card">
            <h3>{item.key}</h3>
            <p>{item.summary}</p>
            {item.ssotLinks.length > 0 ? (
              <ul className="link-list">
                {item.ssotLinks.map((link) => (
                  <li key={`${item.key}-${link.path}`}>
                    <a href={link.path} target="_blank" rel="noreferrer">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
            <p className="hint">
              更新: {new Date(item.updatedAt).toLocaleString('ja-JP')} · {item.updatedBy}
            </p>
          </article>
        ))}
      </div>

      {dashboard ? (
        <p className="hint">active_mode: {dashboard.activeMode}</p>
      ) : null}
    </section>
  );
}
