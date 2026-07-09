import { describe, expect, it } from 'vitest';

import { mapOpenMeteoHourlyResponse } from './map-hourly-forecast.js';

describe('hourly forecast', () => {
  it('maps upcoming hourly slots', () => {
    const payload = mapOpenMeteoHourlyResponse(
      {
        hourly: {
          time: ['2026-07-09T06:00', '2026-07-09T09:00', '2026-07-09T12:00'],
          precipitation_probability: [10, 40, 70],
          temperature_2m: [22.1, 25.4, 28.8],
        },
      },
      'Asia/Tokyo',
      new Date('2026-07-09T08:00:00+09:00'),
    );

    expect(payload.source).toBe('live');
    expect(payload.slots.length).toBeGreaterThan(0);
    expect(payload.slots[0]?.precipitationPct).toBeGreaterThanOrEqual(0);
    expect(payload.slots[0]?.tempC).toBeGreaterThan(0);
  });
});
