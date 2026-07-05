export type WeatherConfig = {
  enabled: boolean;
  latitude: number;
  longitude: number;
  timezone: string;
};

const DEFAULT_LAT = 35.6762;
const DEFAULT_LON = 139.6503;
const DEFAULT_TIMEZONE = 'Asia/Tokyo';

function parseCoordinate(value: string | undefined, fallback: number): number {
  if (!value?.trim()) return fallback;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseEnabled(value: string | undefined, nodeEnv: string | undefined): boolean {
  if (value?.trim().toLowerCase() === 'false') return false;
  if (value?.trim().toLowerCase() === 'true') return true;
  return nodeEnv !== 'test';
}

/** v2a — 1 地点設定（URMS_WEATHER_LAT / LON · Open-Meteo · API キー不要） */
export function resolveWeatherConfig(env: NodeJS.ProcessEnv = process.env): WeatherConfig {
  return {
    enabled: parseEnabled(env.URMS_WEATHER_ENABLED, env.NODE_ENV),
    latitude: parseCoordinate(env.URMS_WEATHER_LAT, DEFAULT_LAT),
    longitude: parseCoordinate(env.URMS_WEATHER_LON, DEFAULT_LON),
    timezone: env.URMS_WEATHER_TIMEZONE?.trim() || DEFAULT_TIMEZONE,
  };
}
