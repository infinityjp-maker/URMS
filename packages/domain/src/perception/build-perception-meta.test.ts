import { describe, expect, it } from 'vitest';

import { buildDefaultContextDashboard } from '../context/context-defaults.js';
import { buildPerceptionMeta } from './build-perception-meta.js';
import { buildPerceptionState } from './build-perception-state.js';

describe('buildPerceptionMeta', () => {
  it('reflects actionable task and live sources', () => {
    const dashboard = buildDefaultContextDashboard('operate');
    const state = buildPerceptionState(dashboard, new Date('2026-07-06T10:00:00+09:00'), {
      weather: {
        tempC: 24,
        precipitationPct: 10,
        humidityPct: 60,
        windKmh: 4,
        hint: '快晴',
      },
      nextEvents: [{ time: '10:00', title: 'デイリー', tone: 'calm' }],
    });

    expect(buildPerceptionMeta(dashboard, state)).toEqual({
      canAdvanceTask: true,
      sources: {
        context: 'api',
        scheduleEvents: 1,
        weather: 'live',
      },
    });
  });

  it('marks empty weather when no live data', () => {
    const dashboard = buildDefaultContextDashboard('operate');
    const state = buildPerceptionState(dashboard);

    expect(buildPerceptionMeta(dashboard, state).sources.weather).toBe('empty');
  });
});
