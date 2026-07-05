import { describe, expect, it } from 'vitest';

import { buildDefaultContextDashboard } from './context-defaults.js';
import { buildAdvanceTaskUpdates, canAdvanceTask } from './advance-context-task.js';

describe('buildAdvanceTaskUpdates', () => {
  it('promotes next_task to current_task when both are set', () => {
    const dashboard = buildDefaultContextDashboard('operate');
    const updates = buildAdvanceTaskUpdates(
      dashboard,
      new Date('2026-07-06T10:00:00+09:00'),
    );

    expect(updates).toEqual([
      {
        key: 'current_task',
        summary: 'VT-2 — Context 脳（グラフ + 時間から「今」を合成）',
        ssotLinks: expect.any(Array),
      },
      {
        key: 'next_task',
        summary: expect.stringContaining('VT-1'),
        ssotLinks: [],
      },
      {
        key: 'project_status',
        summary: expect.stringContaining('直近ループ'),
        ssotLinks: expect.any(Array),
      },
    ]);
  });

  it('marks current_task complete when next_task is empty', () => {
    const dashboard = buildDefaultContextDashboard('operate');
    dashboard.items = dashboard.items.map((item) =>
      item.key === 'next_task' ? { ...item, summary: '次を plan Mode で設定' } : item,
    );

    const updates = buildAdvanceTaskUpdates(dashboard, new Date('2026-07-06T10:00:00+09:00'));

    expect(updates[0]?.key).toBe('current_task');
    expect(updates[0]?.summary).toContain('完了 ·');
    expect(updates[1]?.key).toBe('next_task');
  });

  it('returns no updates when current_task is not actionable', () => {
    const dashboard = buildDefaultContextDashboard('operate');
    dashboard.items = dashboard.items.map((item) =>
      item.key === 'current_task' ? { ...item, summary: '未設定' } : item,
    );

    expect(buildAdvanceTaskUpdates(dashboard)).toEqual([]);
    expect(canAdvanceTask(dashboard)).toBe(false);
  });
});
