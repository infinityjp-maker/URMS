import { describe, expect, it } from 'vitest';

import { buildDefaultContextDashboard } from '../context/context-defaults.js';
import { EMPTY_WEATHER } from './fixtures.js';
import {
  synthesizeAiMemo,
  synthesizeConditionScore,
  synthesizeSummaryNote,
} from './synthesize-context-note.js';

describe('synthesizeSummaryNote', () => {
  it('builds a narrative from phase, schedule, tasks, and weather', () => {
    const note = synthesizeSummaryNote(
      buildDefaultContextDashboard('operate'),
      'day',
      {
        nextEvents: [{ time: '09:30', title: '朝会', tone: 'focus' }],
        weather: { tempC: 22, precipitationPct: 0, humidityPct: 50, windKmh: 3, hint: '晴れ' },
      },
    );

    expect(note).toContain('昼 · 予定 1');
    expect(note).toContain('タスク 2');
    expect(note).toContain('天気 22°C');
  });

  it('marks weather as missing when empty', () => {
    const note = synthesizeSummaryNote(buildDefaultContextDashboard('operate'), 'morning', {
      weather: EMPTY_WEATHER,
    });

    expect(note).toContain('天気未取得');
  });

  it('includes relation graph in summary note', () => {
    const note = synthesizeSummaryNote(buildDefaultContextDashboard('operate'), 'day', {
      graphSignal: {
        activeRelations: 3,
        byType: { depends_on: 2, member_of: 1 },
      },
    });

    expect(note).toContain('関係 3 · depends_on 2 · member_of 1');
  });
});

describe('synthesizeAiMemo', () => {
  it('combines upcoming event with current focus', () => {
    expect(
      synthesizeAiMemo('VT-1', 'VT-2', [{ time: '09:30', title: '朝会', tone: 'focus' }]),
    ).toBe('09:30 朝会 · いま: VT-2');
  });

  it('includes relative schedule note when present', () => {
    expect(
      synthesizeAiMemo('VT-1', 'VT-2', [
        { time: '09:30', title: '朝会', note: 'あと 45m', tone: 'focus' },
      ]),
    ).toBe('09:30 朝会 (あと 45m) · いま: VT-2');
  });

  it('prefixes loop continuity when journal entries exist', () => {
    const memo = synthesizeAiMemo(
      'VT-2',
      'VT-3',
      [],
      [
        {
          completed: 'VT-1 task',
          actorId: 'window-user',
          at: new Date('2026-07-05T17:30:00+09:00'),
        },
      ],
      new Date('2026-07-06T09:00:00+09:00'),
    );

    expect(memo).toContain('新しい一日');
    expect(memo).toContain('VT-3');
  });
});

describe('synthesizeConditionScore', () => {
  it('scores from real signals only', () => {
    expect(synthesizeConditionScore(2, 2, true)).toBe(70);
    expect(synthesizeConditionScore(0, 0, false)).toBe(0);
  });
});
