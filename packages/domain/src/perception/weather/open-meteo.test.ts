import { describe, expect, it } from 'vitest';

import { buildOpenMeteoUrl, mapOpenMeteoResponse } from './open-meteo.js';

describe('open-meteo', () => {
  it('builds forecast URL with coordinates and timezone', () => {
    const url = buildOpenMeteoUrl({
      latitude: 35.6762,
      longitude: 139.6503,
      timezone: 'Asia/Tokyo',
    });

    expect(url).toContain('api.open-meteo.com');
    expect(url).toContain('latitude=35.6762');
    expect(url).toContain('timezone=Asia%2FTokyo');
  });

  it('maps API payload into perception weather', () => {
    const weather = mapOpenMeteoResponse({
      current: {
        time: '2026-07-05T14:00',
        temperature_2m: 22.4,
        relative_humidity_2m: 78.2,
        wind_speed_10m: 11.6,
      },
      hourly: {
        time: ['2026-07-05T13:00', '2026-07-05T14:00'],
        precipitation_probability: [20, 45],
      },
    });

    expect(weather).toEqual({
      tempC: 22,
      humidityPct: 78,
      windKmh: 12,
      precipitationPct: 45,
      hint: '折りたたみ傘があると安心です',
    });
  });
});
