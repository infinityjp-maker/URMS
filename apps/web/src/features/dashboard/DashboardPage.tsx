export function DashboardPage() {
  return (
    <section className="page-card" aria-label="ダッシュボード">
      <h2>ダッシュボード</h2>
      <div className="info-grid">
        <article className="info-card">
          <h3>現在フェーズ</h3>
          <p>Phase 3 — Sprint S5 Web 基盤</p>
        </article>
        <article className="info-card">
          <h3>現在タスク</h3>
          <p>Resource UI + Mode Switcher 実装</p>
        </article>
        <article className="info-card">
          <h3>プロジェクト状態</h3>
          <p>実装中</p>
        </article>
      </div>
      <p className="hint">
        運用 Mode で Resource 管理、監査 Mode で監査ログを参照できます。Context ダッシュボードは Sprint S6 で追加します。
      </p>
    </section>
  );
}
