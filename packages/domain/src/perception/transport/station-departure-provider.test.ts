import { describe, expect, it, vi } from 'vitest';

import { resolveStationDepartures } from './station-departure-provider.js';

describe('resolveStationDepartures', () => {
  it('falls back to interval when ODPT is unavailable', async () => {
    const result = await resolveStationDepartures({
      config: {
        enabled: true,
        timezone: 'Asia/Tokyo',
        stationName: '渋谷',
        walkToStationMinutes: 8,
        bufferMinutes: 5,
        rideMinutes: 25,
        spareCoffeeThresholdMinutes: 10,
        departureIntervalMinutes: 30,
        odptConsumerKey: 'invalid',
        odptStationId: 'odpt.Station:Example',
      },
      targetDate: new Date('2026-07-09T08:00:00+09:00'),
      fetchImpl: vi.fn(async () => new Response('{}', { status: 401 })),
    });

    expect(result.source).toBe('interval');
    expect(result.departures.length).toBeGreaterThan(0);
  });
});
