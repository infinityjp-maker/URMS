import type { PerceptionState, WeatherHourlyPayload, WeatherWeeklyPayload } from '@urms/shared';

import type { ResourceRepository } from '../../repository/resource-repository.js';
import { EMPTY_WEATHER } from '../fixtures.js';
import { buildOpenMeteoUrl, buildOpenMeteoHourlyUrl, buildOpenMeteoWeeklyUrl, mapOpenMeteoResponse, type OpenMeteoResponse, type WeatherFetch } from './open-meteo.js';
import { emptyHourlyPayload, mapOpenMeteoHourlyResponse } from './map-hourly-forecast.js';
import { emptyWeeklyPayload, mapOpenMeteoWeeklyResponse } from './map-weekly-forecast.js';
import { resolveWeatherConfig, type WeatherConfig } from './weather-config.js';
import { resolveWeatherConfigWithLocation } from './resolve-weather-config.js';

export type WeatherCoordOverride = {
  latitude: number;
  longitude: number;
};

export interface WeatherService {
  getCurrentWeather(coords?: WeatherCoordOverride): Promise<PerceptionState['weather']>;
  getWeeklyForecast(coords?: WeatherCoordOverride): Promise<WeatherWeeklyPayload>;
  getHourlyForecast(coords?: WeatherCoordOverride, now?: Date): Promise<WeatherHourlyPayload>;
}

export type WeatherServiceOptions = {
  config?: WeatherConfig;
  fetchImpl?: WeatherFetch;
  timeoutMs?: number;
  resourceRepository?: ResourceRepository;
};

const DEFAULT_TIMEOUT_MS = 4_000;

export class OpenMeteoWeatherService implements WeatherService {
  private readonly baseConfig: WeatherConfig;
  private readonly fetchImpl: WeatherFetch;
  private readonly timeoutMs: number;
  private readonly resourceRepository?: ResourceRepository;

  constructor(options: WeatherServiceOptions = {}) {
    this.baseConfig = options.config ?? resolveWeatherConfig();
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.resourceRepository = options.resourceRepository;
  }

  async getCurrentWeather(coords?: WeatherCoordOverride): Promise<PerceptionState['weather']> {
    let config = await resolveWeatherConfigWithLocation(this.resourceRepository, this.baseConfig);

    if (coords) {
      config = {
        ...config,
        latitude: coords.latitude,
        longitude: coords.longitude,
      };
    }

    if (!config.enabled) {
      return EMPTY_WEATHER;
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

      const response = await this.fetchImpl(buildOpenMeteoUrl(config), {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      clearTimeout(timeout);

      if (!response.ok) {
        return EMPTY_WEATHER;
      }

      const payload = (await response.json()) as OpenMeteoResponse;
      return mapOpenMeteoResponse(payload);
    } catch {
      return EMPTY_WEATHER;
    }
  }

  async getWeeklyForecast(coords?: WeatherCoordOverride): Promise<WeatherWeeklyPayload> {
    let config = await resolveWeatherConfigWithLocation(this.resourceRepository, this.baseConfig);

    if (coords) {
      config = {
        ...config,
        latitude: coords.latitude,
        longitude: coords.longitude,
      };
    }

    if (!config.enabled) {
      return emptyWeeklyPayload(config.timezone);
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

      const response = await this.fetchImpl(buildOpenMeteoWeeklyUrl(config), {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      clearTimeout(timeout);

      if (!response.ok) {
        return emptyWeeklyPayload(config.timezone);
      }

      const payload = (await response.json()) as OpenMeteoResponse;
      return mapOpenMeteoWeeklyResponse(payload, config.timezone);
    } catch {
      return emptyWeeklyPayload(config.timezone);
    }
  }

  async getHourlyForecast(coords?: WeatherCoordOverride, now = new Date()): Promise<WeatherHourlyPayload> {
    let config = await resolveWeatherConfigWithLocation(this.resourceRepository, this.baseConfig);

    if (coords) {
      config = {
        ...config,
        latitude: coords.latitude,
        longitude: coords.longitude,
      };
    }

    if (!config.enabled) {
      return emptyHourlyPayload(config.timezone);
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

      const response = await this.fetchImpl(buildOpenMeteoHourlyUrl(config), {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      clearTimeout(timeout);

      if (!response.ok) {
        return emptyHourlyPayload(config.timezone);
      }

      const payload = (await response.json()) as OpenMeteoResponse;
      return mapOpenMeteoHourlyResponse(payload, config.timezone, now);
    } catch {
      return emptyHourlyPayload(config.timezone);
    }
  }
}

export function createWeatherService(options: WeatherServiceOptions = {}): WeatherService {
  return new OpenMeteoWeatherService(options);
}
