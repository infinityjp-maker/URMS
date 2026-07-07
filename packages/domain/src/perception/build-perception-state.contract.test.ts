import { describe, expect, it } from 'vitest';

import { buildDefaultContextDashboard } from '../context/context-defaults.js';
import { buildPerceptionState } from './build-perception-state.js';
import { EMPTY_WEATHER } from './fixtures.js';
import type { LoopJournalEntry } from '../loop-journal/loop-journal-service.js';

/** VT-2/VT-4 — 固定日時 · 代表 narrative の契約（スナップショット代替） */
const JOURNAL_YESTERDAY: LoopJournalEntry = {
  completed: 'VT-1 task',
  next: 'VT-2 task',
  actorId: 'window-user',
  at: new Date('2026-07-05T17:30:00+09:00'),
};

const JOURNAL_TODAY: LoopJournalEntry = {
  completed: 'VT-2 task',
  next: 'VT-3 task',
  actorId: 'window-user',
  at: new Date('2026-07-06T10:00:00+09:00'),
};

describe('buildPerceptionState contract', () => {
  it('empty SSOT — honest weather and no fabricated events', () => {
    const state = buildPerceptionState(
      { activeMode: 'operate', items: [] },
      new Date('2026-07-06T14:00:00+09:00'),
    );

    expect({
      phase: state.phase,
      weather: state.weather,
      nextEvents: state.nextEvents,
      tasks: state.tasks,
      summaryEvents: state.summary.events,
      summaryTasks: state.summary.tasks,
      noteIncludes: state.summary.note.includes('天気未取得'),
    }).toEqual({
      phase: 'day',
      weather: EMPTY_WEATHER,
      nextEvents: [],
      tasks: [],
      summaryEvents: 0,
      summaryTasks: 0,
      noteIncludes: true,
    });
  });

  it('new-day — statusLine from journal · no duplicate in aiMemo/summary', () => {
    const state = buildPerceptionState(
      buildDefaultContextDashboard('operate'),
      new Date('2026-07-06T09:00:00+09:00'),
      { loopJournal: [JOURNAL_YESTERDAY] },
    );

    expect(state.statusLine).toBe('新しい一日 · 昨日のループ: VT-1 task → 次: VT-2 task');
    expect(state.aiMemo).not.toContain('新しい一日');
    expect(state.summary.note).not.toContain('新しい一日');
    expect(state.aiMemo).toContain('VT-4');
  });

  it('looped-today — statusLine from today journal entry', () => {
    const state = buildPerceptionState(
      buildDefaultContextDashboard('operate'),
      new Date('2026-07-06T12:00:00+09:00'),
      { loopJournal: [JOURNAL_TODAY] },
    );

    expect(state.statusLine).toBe('今日 10:00 にループ · 完了: VT-2 task → 次: VT-3 task');
    expect(state.aiMemo).not.toContain('今日 10:00 にループ');
  });

  it('advance priority — 直近ループ project_status wins over journal narrative', () => {
    const dashboard = buildDefaultContextDashboard('operate');
    dashboard.items = dashboard.items.map((item) =>
      item.key === 'project_status'
        ? { ...item, summary: '直近ループ 7/6 10:00 · 次: VT-3 task' }
        : item,
    );

    const state = buildPerceptionState(dashboard, new Date('2026-07-06T12:00:00+09:00'), {
      loopJournal: [JOURNAL_TODAY],
    });

    expect(state.statusLine).toBe('直近ループ 7/6 10:00 · 次: VT-3 task');
  });

  it('VT-2 signals — location · relations · schedule note in synthesis', () => {
    const state = buildPerceptionState(
      buildDefaultContextDashboard('operate'),
      new Date('2026-07-06T14:00:00+09:00'),
      {
        locationLabel: '現在地',
        graphSignal: { activeRelations: 2, byType: { depends_on: 2 } },
        nextEvents: [
          { time: '15:00', title: '定例', note: 'あと 45m', tone: 'focus' },
        ],
        weather: {
          tempC: 22,
          precipitationPct: 10,
          humidityPct: 50,
          windKmh: 5,
          hint: '快晴',
        },
      },
    );

    expect(state.summary.note).toContain('地点 現在地');
    expect(state.summary.note).toContain('関係 2');
    expect(state.summary.note).toContain('天気 22°C');
    expect(state.aiMemo).toContain('15:00 定例 (あと 45m)');
  });
});
