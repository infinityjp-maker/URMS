import { createDomainCore } from '@urms/domain';
import { URMS_MODES } from '@urms/shared';

const domainCore = createDomainCore();

export function DashboardPage() {
  return (
    <section className="dashboard-card" aria-label="ダッシュボード">
      <h2>ダッシュボード</h2>
      <p>Sprint S1 — Monorepo 基盤が起動しています。</p>
      <p>Resource / Mode / Context の実装は S2 以降で追加します。</p>
      <ul className="dashboard-meta">
        <li>
          <strong>Contract SSOT:</strong> {domainCore.contract.documentPath}
        </li>
        <li>
          <strong>Contract ADR:</strong> {domainCore.contract.adr}
        </li>
        <li>
          <strong>対応 Mode（設計）:</strong> {URMS_MODES.join(' / ')}
        </li>
        <li>
          <strong>Domain Core:</strong> {domainCore.version}
        </li>
      </ul>
    </section>
  );
}
