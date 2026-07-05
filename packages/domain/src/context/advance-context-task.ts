import type { ContextDashboard, ContextUpdateItem } from '@urms/shared';

function findItem(dashboard: ContextDashboard, key: string) {
  return dashboard.items.find((item) => item.key === key);
}

function isActionableTask(summary: string | undefined): summary is string {
  if (!summary?.trim()) return false;
  if (summary.includes('未設定')) return false;
  if (summary.startsWith('完了 ·')) return false;
  if (summary.startsWith('完了:')) return false;
  if (summary.startsWith('次を plan Mode で設定')) return false;
  return true;
}

/** 窓からの 1 アクション — current_task 完了 · next_task を繰り上げ */
export function buildAdvanceTaskUpdates(dashboard: ContextDashboard, now = new Date()): ContextUpdateItem[] {
  const currentItem = findItem(dashboard, 'current_task');
  const nextItem = findItem(dashboard, 'next_task');
  const current = currentItem?.summary;
  const next = nextItem?.summary;

  if (!isActionableTask(current)) {
    return [];
  }

  const stamp = now.toLocaleString('ja-JP', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  if (isActionableTask(next)) {
    return [
      {
        key: 'current_task',
        summary: next,
        ssotLinks: nextItem?.ssotLinks ?? [],
      },
      {
        key: 'next_task',
        summary: `次を plan Mode で設定（${stamp} に「${current}」完了）`,
        ssotLinks: [],
      },
    ];
  }

  return [
    {
      key: 'current_task',
      summary: `完了 · ${current}（${stamp}）`,
      ssotLinks: currentItem?.ssotLinks ?? [],
    },
    {
      key: 'next_task',
      summary: '次を plan Mode で設定',
      ssotLinks: [],
    },
  ];
}

export function canAdvanceTask(dashboard: ContextDashboard): boolean {
  return buildAdvanceTaskUpdates(dashboard).length > 0;
}

export function canAdvancePerceptionState(state: { tasks: string[] }): boolean {
  return isActionableTask(state.tasks[0]);
}
