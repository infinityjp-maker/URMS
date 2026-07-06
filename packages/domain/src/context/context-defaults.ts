import {
  type ContextDashboard,
  type ContextKey,
  type ContextSnapshotItem,
  type UrmsMode,
} from '@urms/shared';

/** DB 未投入時 · オフライン窓の Context 正本（PM が current-task と同期） */
export const DEFAULT_CONTEXT_ITEMS: Record<
  ContextKey,
  Pick<ContextSnapshotItem, 'summary' | 'ssotLinks'>
> = {
  current_phase: {
    summary: 'Vision Track — VT-1 SSOT 重力 · 偽フィクスチャ卒業',
    ssotLinks: [{ label: 'VISION', path: '/docs/project/VISION.md' }],
  },
  current_task: {
    summary: 'VT-2 — Context 脳（地点 · グラフ · 時間から「今」を合成）',
    ssotLinks: [{ label: 'Desktop UI', path: '/docs/implementation/11-phase5-desktop-ui.md' }],
  },
  next_task: {
    summary: 'VT-4 — 日次ループ narrative · journal 連続性',
    ssotLinks: [{ label: 'Context Engine', path: '/docs/architecture/06-context-engine.md' }],
  },
  project_status: {
    summary: 'Vision 体験 ~19% — perception 合成 · 日次ループ接続中',
    ssotLinks: [{ label: 'VISION', path: '/docs/project/VISION.md' }],
  },
  active_mode: {
    summary: 'operate',
    ssotLinks: [],
  },
  ssot_links: {
    summary: 'VISION · UI Requirements · Implementation Contract',
    ssotLinks: [
      { label: 'VISION', path: '/docs/project/VISION.md' },
      { label: 'UI Requirements', path: '/docs/requirements/ui-requirements.md' },
      { label: 'Implementation Contract', path: '/docs/implementation/01-implementation-contract.md' },
    ],
  },
};

export function buildDefaultContextDashboard(activeMode: UrmsMode = 'operate'): ContextDashboard {
  const now = new Date().toISOString();

  return {
    activeMode,
    items: (Object.keys(DEFAULT_CONTEXT_ITEMS) as ContextKey[]).map((key) => ({
      key,
      summary: DEFAULT_CONTEXT_ITEMS[key].summary,
      ssotLinks: DEFAULT_CONTEXT_ITEMS[key].ssotLinks,
      updatedAt: now,
      updatedBy: 'system',
    })),
  };
}
