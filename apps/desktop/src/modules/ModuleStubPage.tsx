import { ModuleScreenLayout } from './ModuleScreenLayout.js';
import { screenById } from './screen-registry.js';

type Props = {
  readonly screenId: string;
};

export function ModuleStubPage({ screenId }: Props) {
  const meta = screenById(screenId);
  const title = meta?.name ?? screenId;
  const moduleLabel = meta?.moduleLabel ?? 'モジュール';

  return (
    <ModuleScreenLayout screenId={screenId} title={title} moduleLabel={moduleLabel}>
      <section className="glass-card">
        <p className="card-kicker">準備中</p>
        <p className="hint-line">{meta?.note ?? 'この画面は v0.2 ロードマップで実装予定です。'}</p>
        <p className="hint-line">設計: docs/product/07-full-product-v0.2-draft.md</p>
      </section>
    </ModuleScreenLayout>
  );
}
