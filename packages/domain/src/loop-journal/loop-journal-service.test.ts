import { describe, expect, it } from 'vitest';

import { buildDefaultContextDashboard } from '../context/context-defaults.js';
import { extractLoopJournalEntry } from './loop-journal-service.js';

describe('extractLoopJournalEntry', () => {
  it('captures completed and next task summaries', () => {
    const before = buildDefaultContextDashboard('operate');
    const after = buildDefaultContextDashboard('operate');
    after.items = after.items.map((item) =>
      item.key === 'current_task'
        ? { ...item, summary: 'VT-2 — Context 脳（グラフ + 時間から「今」を合成）' }
        : item,
    );

    const entry = extractLoopJournalEntry(
      before,
      after,
      'window-user',
      new Date('2026-07-06T10:00:00+09:00'),
    );

    expect(entry).toEqual({
      completed: 'VT-1 — location/schedule SSOT · pnpm ssot:sync',
      next: 'VT-2 — Context 脳（グラフ + 時間から「今」を合成）',
      actorId: 'window-user',
      at: new Date('2026-07-06T10:00:00+09:00'),
    });
  });

  it('returns null when current_task did not change', () => {
    const dashboard = buildDefaultContextDashboard('operate');
    expect(extractLoopJournalEntry(dashboard, dashboard, 'window-user')).toBeNull();
  });
});
