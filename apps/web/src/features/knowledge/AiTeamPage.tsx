const AI_TEAM_ITEMS = [
  { kind: 'team', id: 'urms-ai-v1', name: 'URMS AI 開発チーム v1' },
  { kind: 'role', id: 'pm', name: 'プロジェクトマネージャ' },
  { kind: 'role', id: 'architect', name: 'アーキテクト' },
  { kind: 'role', id: 'developer', name: 'Developer' },
  { kind: 'role', id: 'reviewer', name: 'Reviewer' },
  { kind: 'role', id: 'tester', name: 'Tester' },
  { kind: 'role', id: 'document-writer', name: 'Document Writer' },
  { kind: 'role', id: 'knowledge-manager', name: 'Knowledge Manager' },
  { kind: 'command', id: 'pm', name: '/pm' },
  { kind: 'command', id: 'plan', name: '/plan' },
  { kind: 'command', id: 'design', name: '/design' },
  { kind: 'command', id: 'implement', name: '/implement' },
  { kind: 'skill', id: 'review', name: 'コードレビュー' },
  { kind: 'skill', id: 'typescript', name: 'TypeScript' },
  { kind: 'skill', id: 'prisma', name: 'Prisma / PostgreSQL' },
];

export function AiTeamPage() {
  return (
    <section className="page-card">
      <h2>AI Team 参照</h2>
      <p className="subtle">
        read-only — `docs/ai-team/` および `.cursor/` 相当のメタモデル参照（UC-009）。
      </p>
      <table className="data-table">
        <thead>
          <tr>
            <th>種別</th>
            <th>ID</th>
            <th>名称</th>
            <th>参照</th>
          </tr>
        </thead>
        <tbody>
          {AI_TEAM_ITEMS.map((item) => (
            <tr key={`${item.kind}-${item.id}`}>
              <td>{item.kind}</td>
              <td>
                <code>{item.id}</code>
              </td>
              <td>{item.name}</td>
              <td>
                <code>docs/ai-team/</code>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
