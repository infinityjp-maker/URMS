import type { PerceptionState } from '@urms/shared';

import type { ResourceRepository } from '../../repository/resource-repository.js';
import { EMPTY_WEATHER } from '../fixtures.js';
import { buildOpenMeteoUrl, mapOpenMeteoResponse, type OpenMeteoResponse, type WeatherFetch } from './open-meteo.js';
import { resolveWeatherConfig, type WeatherConfig } from './weather-config.js';
import { resolveWeatherConfigWithLocation } from './resolve-weather-config.js';

export interface WeatherService {
  getCurrentWeather(): Promise<PerceptionState['weather']>;
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

  async getCurrentWeather(): Promise<PerceptionState['weather']> {
    const config = await resolveWeatherConfigWithLocation(this.resourceRepository, this.baseConfig);

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
}

export function createWeatherService(options: WeatherServiceOptions = {}): WeatherService {
  return new OpenMeteoWeatherService(options);
}
