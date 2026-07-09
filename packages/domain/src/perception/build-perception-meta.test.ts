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
        illustrationId: 'clear-day',
      },
      nextEvents: [{ time: '10:00', title: 'デイリー', tone: 'calm' }],
    });

    expect(buildPerceptionMeta(dashboard, state)).toEqual({
      canAdvanceTask: true,
      sources: {
        context: 'api',
        scheduleEvents: 1,
        weather: 'live',
        weatherCoords: null,
        loopJournalEntries: 0,
        loopContinuity: 'none',
        loopNarrative: null,
        relations: 0,
        relationTypes: {},
        placeName: null,
        location: null,
      },
    });
  });

  it('records weather coord source and loop narrative', () => {
    const dashboard = buildDefaultContextDashboard('operate');
    const state = buildPerceptionState(dashboard, new Date('2026-07-06T10:00:00+09:00'));
    const loopJournal = [
      {
        completed: 'VT-2 task',
        next: 'VT-3 task',
        actorId: 'window-user',
        at: new Date('2026-07-06T10:00:00+09:00'),
      },
    ];

    const meta = buildPerceptionMeta(
      dashboard,
      state,
      loopJournal,
      new Date('2026-07-06T10:30:00+09:00'),
      { activeRelations: 0, byType: {} },
      '自宅',
      'device',
      '東京都渋谷区',
    );

    expect(meta.sources.weatherCoords).toBe('device');
    expect(meta.sources.location).toBe('自宅');
    expect(meta.sources.placeName).toBe('東京都渋谷区');
    expect(meta.sources.loopNarrative).toContain('→ 次: VT-3 task');
    expect(meta.sources.loopContinuity).toBe('looped-today');
  });

  it('marks empty weather when no live data', () => {
    const dashboard = buildDefaultContextDashboard('operate');
    const state = buildPerceptionState(dashboard);

    expect(buildPerceptionMeta(dashboard, state).sources.weather).toBe('empty');
  });

  it('reflects loop journal continuity', () => {
    const dashboard = buildDefaultContextDashboard('operate');
    const state = buildPerceptionState(dashboard, new Date('2026-07-06T09:00:00+09:00'));
    const loopJournal = [
      {
        completed: 'VT-1 task',
        actorId: 'window-user',
        at: new Date('2026-07-05T17:30:00+09:00'),
      },
    ];

    expect(
      buildPerceptionMeta(dashboard, state, loopJournal, new Date('2026-07-06T09:00:00+09:00')),
    ).toMatchObject({
      sources: {
        loopJournalEntries: 1,
        loopContinuity: 'new-day',
      },
    });
  });
});
