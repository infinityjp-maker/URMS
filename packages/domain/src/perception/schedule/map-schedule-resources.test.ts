import { describe, expect, it } from 'vitest';

import type { ResourceEntity } from '@urms/shared';

import { formatRelativeEventNote, mapScheduleResourcesToEvents, buildDailyOccurrence, mapScheduleResourcesForMonth } from './map-schedule-resources.js';

const sampleResource = (overrides: Partial<ResourceEntity> = {}): ResourceEntity => ({
  resourceType: 'schedule',
  resourceId: 'evt-1',
  name: 'プロジェクト定例',
  status: 'active',
  metadata: {
    startAt: '2026-07-05T09:30:00+09:00',
    tone: 'calm',
  },
  createdAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-01T00:00:00.000Z',
  ...overrides,
});

describe('mapScheduleResourcesToEvents', () => {
  it('maps today schedule resources sorted by time', () => {
    const now = new Date('2026-07-05T08:00:00+09:00');
    const events = mapScheduleResourcesToEvents(
      [
        sampleResource({
          resourceId: 'evt-2',
          name: 'ランチ',
          metadata: { startAt: '2026-07-05T13:00:00+09:00', tone: 'warm' },
        }),
        sampleResource(),
      ],
      now,
      'Asia/Tokyo',
      8,
    );

    expect(events).toEqual([
      { time: '09:30', title: 'プロジェクト定例', note: 'あと 1h 30m', tone: 'calm' },
      { time: '13:00', title: 'ランチ', note: 'あと 5h 0m', tone: 'warm' },
    ]);
  });

  it('skips resources without valid startAt or different day', () => {
    const now = new Date('2026-07-05T08:00:00+09:00');
    const events = mapScheduleResourcesToEvents(
      [
        sampleResource({ metadata: {} }),
        sampleResource({
          resourceId: 'evt-3',
          metadata: { startAt: '2026-07-06T09:00:00+09:00' },
        }),
      ],
      now,
      'Asia/Tokyo',
      8,
    );

    expect(events).toEqual([]);
  });

  it('maps daily recurrence schedules for today', () => {
    const now = new Date('2026-07-06T08:00:00+09:00');
    const events = mapScheduleResourcesToEvents(
      [
        sampleResource({
          resourceId: 'daily-standup',
          name: 'URMS 朝チェックイン',
          metadata: {
            recurrence: 'daily',
            time: '09:30',
            timezone: 'Asia/Tokyo',
            tone: 'focus',
            note: 'Vision Track 確認',
          },
        }),
      ],
      now,
      'Asia/Tokyo',
      8,
    );

    expect(events).toEqual([
      {
        time: '09:30',
        title: 'URMS 朝チェックイン',
        note: 'Vision Track 確認',
        tone: 'focus',
      },
    ]);
  });
});

describe('formatRelativeEventNote', () => {
  it('builds daily occurrence in Asia/Tokyo', () => {
    const now = new Date('2026-07-06T08:00:00+09:00');
    const start = buildDailyOccurrence(now, '09:30', 'Asia/Tokyo');
    expect(start?.toISOString()).toBe('2026-07-06T00:30:00.000Z');
  });

  it('returns undefined for past events', () => {
    const now = new Date('2026-07-05T10:00:00+09:00');
    const start = new Date('2026-07-05T09:00:00+09:00');
    expect(formatRelativeEventNote(start, now)).toBeUndefined();
  });
});

describe('mapScheduleResourcesForMonth', () => {
  it('maps one-off and daily events across the month', () => {
    const now = new Date('2026-07-05T08:00:00+09:00');
    const days = mapScheduleResourcesForMonth(
      [
        sampleResource(),
        sampleResource({
          resourceId: 'daily-standup',
          name: 'URMS 朝チェックイン',
          metadata: {
            recurrence: 'daily',
            time: '09:30',
            timezone: 'Asia/Tokyo',
            tone: 'focus',
          },
        }),
        sampleResource({
          resourceId: 'evt-other-day',
          metadata: { startAt: '2026-07-10T15:00:00+09:00' },
        }),
      ],
      2026,
      7,
      now,
      'Asia/Tokyo',
    );

    expect(days['2026-07-05']).toHaveLength(2);
    expect(days['2026-07-06']).toHaveLength(1);
    expect(days['2026-07-06']?.[0]?.title).toBe('URMS 朝チェックイン');
    expect(days['2026-07-10']).toHaveLength(2);
    expect(days['2026-07-01']?.[0]?.title).toBe('URMS 朝チェックイン');
  });
});
