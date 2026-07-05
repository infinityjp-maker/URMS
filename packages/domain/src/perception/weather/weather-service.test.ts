import { describe, expect, it, vi } from 'vitest';

import { EMPTY_WEATHER } from '../fixtures.js';
import { createWeatherService } from './weather-service.js';

describe('OpenMeteoWeatherService', () => {
  it('returns empty weather when disabled', async () => {
    const service = createWeatherService({
      config: {
        enabled: false,
        latitude: 35.6762,
        longitude: 139.6503,
        timezone: 'Asia/Tokyo',
      },
    });

    await expect(service.getCurrentWeather()).resolves.toEqual(EMPTY_WEATHER);
  });

  it('fetches live weather when enabled', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        current: {
          time: '2026-07-05T14:00',
          temperature_2m: 18,
          relative_humidity_2m: 60,
          wind_speed_10m: 8,
        },
        hourly: {
          time: ['2026-07-05T14:00'],
          precipitation_probability: [10],
        },
      }),
    })) as unknown as typeof fetch;

    const service = createWeatherService({
      config: {
        enabled: true,
        latitude: 35.6762,
        longitude: 139.6503,
        timezone: 'Asia/Tokyo',
      },
      fetchImpl,
    });

    const weather = await service.getCurrentWeather();
    expect(fetchImpl).toHaveBeenCalledOnce();
    expect(weather.tempC).toBe(18);
    expect(weather.hint).toBe('穏やかな天気です');
  });

  it('falls back to empty weather on fetch failure', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error('network');
    }) as unknown as typeof fetch;

    const service = createWeatherService({
      config: {
        enabled: true,
        latitude: 35.6762,
        longitude: 139.6503,
        timezone: 'Asia/Tokyo',
      },
      fetchImpl,
    });

    await expect(service.getCurrentWeather()).resolves.toEqual(EMPTY_WEATHER);
  });
});
