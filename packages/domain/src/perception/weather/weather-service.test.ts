import { describe, expect, it, vi } from 'vitest';

import type { ResourceEntity } from '@urms/shared';

import { EMPTY_WEATHER } from '../fixtures.js';
import {
  resolveWeatherConfigWithLocation,
  weatherConfigFromLocationResource,
} from './resolve-weather-config.js';
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

  it('uses location resource coordinates when repository is provided', async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      expect(url).toContain('latitude=34.6937');
      expect(url).toContain('longitude=135.5023');
      return {
        ok: true,
        json: async () => ({
          current: {
            time: '2026-07-05T14:00',
            temperature_2m: 24,
            relative_humidity_2m: 50,
            wind_speed_10m: 4,
          },
          hourly: {
            time: ['2026-07-05T14:00'],
            precipitation_probability: [0],
          },
        }),
      };
    }) as unknown as typeof fetch;

    const location: ResourceEntity = {
      resourceType: 'location',
      resourceId: 'home',
      name: '大阪',
      status: 'active',
      metadata: {
        latitude: 34.6937,
        longitude: 135.5023,
        timezone: 'Asia/Tokyo',
        primary: true,
      },
      createdAt: '2026-07-01T00:00:00.000Z',
      updatedAt: '2026-07-01T00:00:00.000Z',
    };

    const service = createWeatherService({
      config: {
        enabled: true,
        latitude: 35.6762,
        longitude: 139.6503,
        timezone: 'Asia/Tokyo',
      },
      fetchImpl,
      resourceRepository: {
        list: vi.fn(async () => ({ items: [location], total: 1, page: 1, limit: 16 })),
      } as never,
    });

    const weather = await service.getCurrentWeather();
    expect(weather.tempC).toBe(24);
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

describe('resolveWeatherConfigWithLocation', () => {
  it('prefers primary location resource over env defaults', async () => {
    const base = {
      enabled: true,
      latitude: 35.6762,
      longitude: 139.6503,
      timezone: 'Asia/Tokyo',
    };

    const config = await resolveWeatherConfigWithLocation(
      {
        list: vi.fn(async () => ({
          items: [
            {
              resourceType: 'location',
              resourceId: 'home',
              name: 'Home',
              status: 'active',
              metadata: {
                latitude: 34.6937,
                longitude: 135.5023,
                timezone: 'Asia/Tokyo',
                primary: true,
              },
              createdAt: '',
              updatedAt: '',
            },
          ],
          total: 1,
          page: 1,
          limit: 16,
        })),
      } as never,
      base,
    );

    expect(config.latitude).toBe(34.6937);
    expect(config.longitude).toBe(135.5023);
  });

  it('returns base config when no location resources exist', async () => {
    const base = {
      enabled: true,
      latitude: 35.6762,
      longitude: 139.6503,
      timezone: 'Asia/Tokyo',
    };

    const config = await resolveWeatherConfigWithLocation(
      {
        list: vi.fn(async () => ({ items: [], total: 0, page: 1, limit: 16 })),
      } as never,
      base,
    );

    expect(config).toEqual(base);
  });
});

describe('weatherConfigFromLocationResource', () => {
  it('maps resource metadata to weather config', () => {
    const config = weatherConfigFromLocationResource(
      {
        resourceType: 'location',
        resourceId: 'home',
        name: 'Home',
        status: 'active',
        metadata: { latitude: 35.6, longitude: 139.7, timezone: 'Asia/Tokyo' },
        createdAt: '',
        updatedAt: '',
      },
      {
        enabled: true,
        latitude: 0,
        longitude: 0,
        timezone: 'UTC',
      },
    );

    expect(config).toEqual({
      enabled: true,
      latitude: 35.6,
      longitude: 139.7,
      timezone: 'Asia/Tokyo',
    });
  });
});
