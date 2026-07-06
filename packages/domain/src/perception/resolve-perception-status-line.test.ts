import { describe, expect, it } from 'vitest';

import { buildDefaultContextDashboard } from '../context/context-defaults.js';
import type { LoopJournalEntry } from '../loop-journal/loop-journal-service.js';
import { resolvePerceptionStatusLine } from './resolve-perception-status-line.js';

const yesterdayEntry: LoopJournalEntry = {
  completed: 'VT-1 task',
  next: 'VT-2 task',
  actorId: 'window-user',
  at: new Date('2026-07-05T17:30:00+09:00'),
};

describe('resolvePerceptionStatusLine', () => {
  it('prefers fresh project_status after advance', () => {
    const dashboard = buildDefaultContextDashboard('operate');
    dashboard.items = dashboard.items.map((item) =>
      item.key === 'project_status'
        ? { ...item, summary: '直近ループ 7/6 10:00 · 次: VT-3' }
        : item,
    );

    expect(
      resolvePerceptionStatusLine(
        dashboard,
        'day',
        [{ ...yesterdayEntry, at: new Date('2026-07-06T10:00:00+09:00') }],
        new Date('2026-07-06T12:00:00+09:00'),
      ),
    ).toBe('直近ループ 7/6 10:00 · 次: VT-3');
  });

  it('shows new-day loop narrative on the next morning', () => {
    const dashboard = buildDefaultContextDashboard('operate');

    expect(
      resolvePerceptionStatusLine(dashboard, 'morning', [yesterdayEntry], new Date('2026-07-06T09:00:00+09:00')),
    ).toBe('新しい一日 · 昨日のループ: VT-1 task → 次: VT-2 task');
  });

  it('shows today loop narrative when journal has today entry', () => {
    expect(
      resolvePerceptionStatusLine(
        buildDefaultContextDashboard('operate'),
        'day',
        [
          {
            completed: 'VT-2 task',
            next: 'VT-3 task',
            actorId: 'window-user',
            at: new Date('2026-07-06T10:00:00+09:00'),
          },
        ],
        new Date('2026-07-06T12:00:00+09:00'),
      ),
    ).toBe('今日 10:00 にループ · 完了: VT-2 task → 次: VT-3 task');
  });

  it('falls back to project_status without journal', () => {
    const dashboard = buildDefaultContextDashboard('operate');
    expect(resolvePerceptionStatusLine(dashboard, 'day', [], new Date('2026-07-06T12:00:00+09:00'))).toBe(
      dashboard.items.find((item) => item.key === 'project_status')?.summary,
    );
  });
});
