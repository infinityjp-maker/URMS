import { useEffect, useMemo, useState } from 'react';

import type { KnowledgeDocumentDetail, KnowledgeDocumentSummary } from '@urms/shared';

import { fetchKnowledgeDocument, fetchKnowledgeDocuments } from '../../api/client.js';
import { readKnowledgeDocumentId, knowledgeDocumentHref } from '../../app/appRoute.js';
import { useLifeState } from '../../hooks/useLifeState.js';
import { useMode } from '../../features/mode/mode-context.js';
import { ModuleScreenLayout } from '../ModuleScreenLayout.js';
import { MarkdownContent } from './MarkdownContent.js';

export function DocumentViewPage() {
  const life = useLifeState();
  const { mode } = useMode();
  const selectedId = readKnowledgeDocumentId();
  const [documents, setDocuments] = useState<readonly KnowledgeDocumentSummary[]>([]);
  const [detail, setDetail] = useState<KnowledgeDocumentDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const activeId = useMemo(() => {
    if (selectedId) return selectedId;
    return documents[0]?.id ?? null;
  }, [documents, selectedId]);

  useEffect(() => {
    if (!life.apiOnline) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void fetchKnowledgeDocuments(mode).then((payload) => {
      if (cancelled) return;
      setDocuments(payload?.documents ?? []);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [life.apiOnline, mode]);

  useEffect(() => {
    if (!life.apiOnline || !activeId) {
      setDetail(null);
      return;
    }

    let cancelled = false;
    void fetchKnowledgeDocument(mode, activeId).then((doc) => {
      if (cancelled) return;
      setDetail(doc);
    });

    return () => {
      cancelled = true;
    };
  }, [activeId, life.apiOnline, mode]);

  return (
    <ModuleScreenLayout screenId="M-DOC-VIEW" title="URMS ドキュメント" moduleLabel="知識">
      <section className="glass-card knowledge-layout">
        <div className="knowledge-layout__sidebar">
          <p className="card-kicker">ドキュメント</p>
          {loading ? (
            <p className="hint-line">一覧を読み込み中…</p>
          ) : (
            <ul className="knowledge-doc-list">
              {documents.map((doc) => (
                <li key={doc.id}>
                  <a
                    href={knowledgeDocumentHref(doc.id)}
                    className={`knowledge-doc-list__link${doc.id === activeId ? ' knowledge-doc-list__link--active' : ''}`}
                  >
                    <span className="knowledge-doc-list__title">{doc.title}</span>
                    <span className="knowledge-doc-list__meta">{doc.category}</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="knowledge-layout__content">
          {!life.apiOnline ? (
            <p className="hint-line">API 未起動 — start-dev-servers.bat で起動してください</p>
          ) : detail ? (
            <>
              <p className="card-kicker">{detail.category}</p>
              <h2 className="knowledge-doc-title">{detail.title}</h2>
              <p className="hint-line">{detail.path}</p>
              <MarkdownContent markdown={detail.content} />
            </>
          ) : (
            <p className="hint-line">ドキュメントを選択してください</p>
          )}
        </div>
      </section>
    </ModuleScreenLayout>
  );
}
