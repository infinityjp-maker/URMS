import { describe, expect, it } from 'vitest';

import { buildPerceptionState } from './build-perception-state.js';

describe('buildPerceptionState', () => {
  it('maps context summaries into perception fields', () => {
    const state = buildPerceptionState(
      {
        activeMode: 'operate',
        items: [
          { key: 'project_status', summary: 'Phase 4 進行中', ssotLinks: [], updatedAt: '', updatedBy: '' },
          { key: 'current_task', summary: 'S12 監視', ssotLinks: [], updatedAt: '', updatedBy: '' },
          { key: 'next_task', summary: 'S13 監査', ssotLinks: [], updatedAt: '', updatedBy: '' },
          { key: 'current_phase', summary: 'Phase 5 UI', ssotLinks: [], updatedAt: '', updatedBy: '' },
        ],
      },
      new Date('2026-07-05T14:00:00'),
    );

    expect(state.phase).toBe('day');
    expect(state.statusLine).toBe('Phase 4 進行中');
    expect(state.aiMemo).toBe('S13 監査');
    expect(state.tasks).toEqual(['S12 監視', 'S13 監査']);
  });

  it('uses weather override when provided', () => {
    const state = buildPerceptionState(
      { activeMode: 'operate', items: [] },
      new Date('2026-07-05T14:00:00'),
      {
        tempC: 10,
        precipitationPct: 5,
        humidityPct: 40,
        windKmh: 3,
        hint: 'テスト',
      },
    );

    expect(state.weather.tempC).toBe(10);
    expect(state.weather.hint).toBe('テスト');
  });
});
