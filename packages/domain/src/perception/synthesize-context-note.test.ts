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
});

describe('synthesizeAiMemo', () => {
  it('combines upcoming event with current focus', () => {
    expect(
      synthesizeAiMemo('VT-1', 'VT-2', [{ time: '09:30', title: '朝会', tone: 'focus' }]),
    ).toBe('09:30 朝会 · いま: VT-2');
  });
});

describe('synthesizeConditionScore', () => {
  it('scores from real signals only', () => {
    expect(synthesizeConditionScore(2, 2, true)).toBe(70);
    expect(synthesizeConditionScore(0, 0, false)).toBe(0);
  });
});
