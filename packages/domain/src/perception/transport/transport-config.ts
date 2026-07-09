export type TransportConfig = {
  enabled: boolean;
  timezone: string;
  stationName: string;
  walkToStationMinutes: number;
  bufferMinutes: number;
  rideMinutes: number;
  spareCoffeeThresholdMinutes: number;
  departureIntervalMinutes: number;
  /** ODPT 公共交通オープンデータ（設定時は駅時刻表を優先） */
  odptConsumerKey?: string;
  odptStationId?: string;
  odptOperatorId?: string;
};

const DEFAULT_TIMEZONE = 'Asia/Tokyo';

function parseEnabled(value: string | undefined, nodeEnv: string | undefined): boolean {
  if (value?.trim().toLowerCase() === 'false') return false;
  if (value?.trim().toLowerCase() === 'true') return true;
  return nodeEnv !== 'test';
}

function parseMinutes(value: string | undefined, fallback: number): number {
  if (!value?.trim()) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

/** v0.2 S4 — 簡易交通設定（外部 API 連携前） */
export function resolveTransportConfig(env: NodeJS.ProcessEnv = process.env): TransportConfig {
  return {
    enabled: parseEnabled(env.URMS_TRANSPORT_ENABLED, env.NODE_ENV),
    timezone: env.URMS_TRANSPORT_TIMEZONE?.trim() || env.URMS_SCHEDULE_TIMEZONE?.trim() || DEFAULT_TIMEZONE,
    stationName: env.URMS_TRANSPORT_STATION?.trim() || '最寄り駅',
    walkToStationMinutes: parseMinutes(env.URMS_TRANSPORT_WALK_MINUTES, 8),
    bufferMinutes: parseMinutes(env.URMS_TRANSPORT_BUFFER_MINUTES, 5),
    rideMinutes: parseMinutes(env.URMS_TRANSPORT_RIDE_MINUTES, 25),
    spareCoffeeThresholdMinutes: parseMinutes(env.URMS_TRANSPORT_SPARE_COFFEE_MINUTES, 10),
    departureIntervalMinutes: parseMinutes(env.URMS_TRANSPORT_DEPARTURE_INTERVAL, 10),
    odptConsumerKey: env.URMS_ODPT_CONSUMER_KEY?.trim() || undefined,
    odptStationId: env.URMS_TRANSPORT_ODPT_STATION_ID?.trim() || undefined,
    odptOperatorId: env.URMS_TRANSPORT_ODPT_OPERATOR_ID?.trim() || undefined,
  };
}
