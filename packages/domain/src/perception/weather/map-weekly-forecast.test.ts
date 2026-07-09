import { describe, expect, it } from 'vitest';

import { mapOpenMeteoWeeklyResponse } from './map-weekly-forecast.js';
import { buildOpenMeteoWeeklyUrl } from './open-meteo.js';

describe('weekly forecast', () => {
  it('builds weekly forecast URL with 7 days', () => {
    const url = buildOpenMeteoWeeklyUrl({
      latitude: 35.6762,
      longitude: 139.6503,
      timezone: 'Asia/Tokyo',
    });

    expect(url).toContain('forecast_days=7');
    expect(url).toContain('temperature_2m_max');
  });

  it('maps daily payload into weekly days', () => {
    const payload = mapOpenMeteoWeeklyResponse(
      {
        daily: {
          time: ['2026-07-09', '2026-07-10'],
          weather_code: [0, 61],
          temperature_2m_max: [31.2, 28.4],
          temperature_2m_min: [24.1, 22.0],
          precipitation_probability_max: [10, 70],
          precipitation_sum: [0, 4.5],
        },
      },
      'Asia/Tokyo',
    );

    expect(payload.source).toBe('live');
    expect(payload.days).toHaveLength(2);
    expect(payload.days[0]?.tempMaxC).toBe(31);
    expect(payload.days[0]?.tempMinC).toBe(24);
    expect(payload.days[1]?.illustrationId).toBe('rain');
    expect(payload.days[1]?.precipitationPct).toBe(70);
  });
});
