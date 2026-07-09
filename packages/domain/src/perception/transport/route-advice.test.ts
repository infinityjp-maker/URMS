import { describe, expect, it } from 'vitest';

import { adviseRoute } from './route-advice.js';

describe('adviseRoute', () => {
  it('builds direct route steps', () => {
    const advice = adviseRoute({
      departure: {
        eventTitle: '定例',
        eventTime: '10:00',
        stationName: '渋谷',
        recommendedTrainDeparture: '09:30',
      },
      eventStart: new Date('2026-07-09T10:00:00+09:00'),
      config: {
        rideMinutes: 25,
        timezone: 'Asia/Tokyo',
        stationName: '渋谷',
      },
    });

    expect(advice).toMatchObject({
      estimatedArrival: '09:55',
      transferCount: 0,
      headline: '09:55 到着予想',
    });
    expect(advice?.steps).toHaveLength(2);
  });

  it('adds transfer step for longer rides', () => {
    const advice = adviseRoute({
      departure: {
        eventTitle: '出張',
        eventTime: '11:00',
        stationName: '渋谷',
        recommendedTrainDeparture: '09:30',
      },
      eventStart: new Date('2026-07-09T11:00:00+09:00'),
      config: {
        rideMinutes: 40,
        timezone: 'Asia/Tokyo',
        stationName: '渋谷',
      },
    });

    expect(advice?.transferCount).toBe(1);
    expect(advice?.steps).toHaveLength(3);
  });
});
