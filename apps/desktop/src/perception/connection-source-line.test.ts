import { describe, expect, it } from 'vitest';

import type { PerceptionMeta } from '@urms/shared';

import { formatConnectionSourceLine } from './connection-source-line.js';

const emptySources: PerceptionMeta['sources'] = {
  context: 'api',
  scheduleEvents: 0,
  weather: 'empty',
  weatherCoords: null,
  loopJournalEntries: 0,
  loopContinuity: 'none',
  loopNarrative: null,
  relations: 0,
  relationTypes: {},
  location: null,
};

describe('formatConnectionSourceLine', () => {
  it('shows explicit dashes for missing SSOT signals in API mode', () => {
    const line = formatConnectionSourceLine('api', emptySources);
    expect(line).toContain('天気 —');
    expect(line).toContain('地点 —');
    expect(line).toContain('座標 —');
    expect(line).toContain('関係 —');
    expect(line).toContain('ループ 未記録');
  });

  it('shows GPS coords and loop narrative when present', () => {
    const line = formatConnectionSourceLine('api', {
      ...emptySources,
      scheduleEvents: 2,
      weather: 'live',
      weatherCoords: 'device',
      location: '現在地',
      relations: 3,
      relationTypes: { depends_on: 2, relates_to: 1 },
      loopContinuity: 'looped-today',
      loopNarrative: '今日 10:00 にループ · 完了: VT-2 → 次: VT-3',
    });

    expect(line).toContain('座標 GPS');
    expect(line).toContain('地点 現在地');
    expect(line).toContain('depends_on 2');
    expect(line).toContain('今日ループ済');
    expect(line).toContain('→ 次: VT-3');
  });

  it('omits SSOT-specific dashes in local fallback mode', () => {
    const line = formatConnectionSourceLine('local', emptySources);
    expect(line).toBe('予定 0 件 · 天気 — · Context ローカル');
  });
});
