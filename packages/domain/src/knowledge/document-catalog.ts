export type KnowledgeDocumentEntry = {
  readonly id: string;
  readonly title: string;
  readonly path: string;
  readonly category: string;
  readonly summary: string;
};

/** S6 — アプリ内ドキュメント正本（リポジトリ相対 · 許可リストのみ） */
export const KNOWLEDGE_DOCUMENT_CATALOG: readonly KnowledgeDocumentEntry[] = [
  {
    id: 'readme',
    title: 'URMS ドキュメント概要',
    path: 'docs/README.md',
    category: '概要',
    summary: 'docs 配下の入口',
  },
  {
    id: 'product-overview',
    title: '製品概要 v0.2',
    path: 'docs/product/01-product-overview.md',
    category: '製品',
    summary: '知覚の窓 · モジュール構成',
  },
  {
    id: 'product-v02',
    title: '製品 v0.2 草案',
    path: 'docs/product/07-full-product-v0.2-draft.md',
    category: '製品',
    summary: 'Sprint 計画 · モジュール要件',
  },
  {
    id: 'screen-catalog',
    title: '画面一覧',
    path: 'docs/product/03-screen-catalog.md',
    category: '製品',
    summary: 'M-* 画面 ID と状態',
  },
  {
    id: 'dev-playbook',
    title: '開発者プレイブック',
    path: 'docs/implementation/02-developer-playbook.md',
    category: '開発',
    summary: '起動 · テスト · 品質ゲート',
  },
  {
    id: 'architecture-start',
    title: 'アーキテクチャ入門',
    path: 'docs/architecture/00-start-here.md',
    category: '設計',
    summary: 'システム構成の読み方',
  },
  {
    id: 'viewing-guide',
    title: '環境構築 · 閲覧ガイド',
    path: 'docs/requirements/viewing-guide.md',
    category: '運用',
    summary: 'サーバー起動と確認手順',
  },
] as const;

export function findKnowledgeDocument(id: string): KnowledgeDocumentEntry | undefined {
  return KNOWLEDGE_DOCUMENT_CATALOG.find((entry) => entry.id === id);
}
