const KNOWLEDGE_LINKS = [
  { category: 'ADR', title: 'ADR-017 Implementation Contract', path: 'docs/implementation/01-implementation-contract.md' },
  { category: 'ADR', title: 'ADR-003 Mode System', path: 'docs/project/decisions/ADR-003-mode-system.md' },
  { category: '用語', title: 'Glossary', path: 'docs/project/glossary.md' },
  { category: '哲学', title: 'VISION', path: 'docs/project/VISION.md' },
  { category: '要件', title: 'UI Requirements', path: 'docs/requirements/ui-requirements.md' },
];

export function KnowledgePage() {
  return (
    <section className="page-card">
      <h2>Knowledge 索引</h2>
      <p className="subtle">read-only — MVP ではリポジトリ内ドキュメントへの参照一覧です。</p>
      <table className="data-table">
        <thead>
          <tr>
            <th>カテゴリ</th>
            <th>タイトル</th>
            <th>パス</th>
          </tr>
        </thead>
        <tbody>
          {KNOWLEDGE_LINKS.map((item) => (
            <tr key={item.path}>
              <td>{item.category}</td>
              <td>{item.title}</td>
              <td>
                <code>{item.path}</code>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
