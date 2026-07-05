import type { PerceptionState } from '@urms/shared';

import { buildWeatherHint } from './weather-hint.js';
import type { WeatherConfig } from './weather-config.js';

export type OpenMeteoResponse = {
  current?: {
    time?: string;
    temperature_2m?: number;
    relative_humidity_2m?: number;
    wind_speed_10m?: number;
  };
  hourly?: {
    time?: string[];
    precipitation_probability?: number[];
  };
};

export type WeatherFetch = typeof fetch;

function round(value: number): number {
  return Math.round(value);
}

function resolvePrecipitationPct(currentTime: string | undefined, hourly: OpenMeteoResponse['hourly']): number {
  if (!currentTime || !hourly?.time?.length || !hourly.precipitation_probability?.length) {
    return 0;
  }

  const index = hourly.time.indexOf(currentTime);
  if (index < 0) return 0;
  return round(hourly.precipitation_probability[index] ?? 0);
}

export function mapOpenMeteoResponse(payload: OpenMeteoResponse): PerceptionState['weather'] {
  const tempC = round(payload.current?.temperature_2m ?? 0);
  const humidityPct = round(payload.current?.relative_humidity_2m ?? 0);
  const windKmh = round(payload.current?.wind_speed_10m ?? 0);
  const precipitationPct = resolvePrecipitationPct(payload.current?.time, payload.hourly);

  const metrics = { tempC, precipitationPct, humidityPct, windKmh };
  return {
    ...metrics,
    hint: buildWeatherHint(metrics),
  };
}

export function buildOpenMeteoUrl(config: Pick<WeatherConfig, 'latitude' | 'longitude' | 'timezone'>): string {
  const params = new URLSearchParams({
    latitude: String(config.latitude),
    longitude: String(config.longitude),
    timezone: config.timezone,
    current: 'temperature_2m,relative_humidity_2m,wind_speed_10m',
    hourly: 'precipitation_probability',
    forecast_days: '1',
    wind_speed_unit: 'kmh',
  });

  return `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
}
