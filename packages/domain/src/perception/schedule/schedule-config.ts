import type { PerceptionEventTone } from '@urms/shared';

export const SCHEDULE_RESOURCE_TYPE = 'schedule';

export type ScheduleConfig = {
  enabled: boolean;
  timezone: string;
  limit: number;
};

const DEFAULT_TIMEZONE = 'Asia/Tokyo';
const DEFAULT_LIMIT = 8;

function parseEnabled(value: string | undefined, nodeEnv: string | undefined): boolean {
  if (value?.trim().toLowerCase() === 'false') return false;
  if (value?.trim().toLowerCase() === 'true') return true;
  return nodeEnv !== 'test';
}

function parseLimit(value: string | undefined, fallback: number): number {
  if (!value?.trim()) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/** v2b — schedule Resource から今日の予定を読む */
export function resolveScheduleConfig(env: NodeJS.ProcessEnv = process.env): ScheduleConfig {
  return {
    enabled: parseEnabled(env.URMS_SCHEDULE_ENABLED, env.NODE_ENV),
    timezone: env.URMS_SCHEDULE_TIMEZONE?.trim() || env.URMS_WEATHER_TIMEZONE?.trim() || DEFAULT_TIMEZONE,
    limit: parseLimit(env.URMS_SCHEDULE_LIMIT, DEFAULT_LIMIT),
  };
}

export function isValidEventTone(value: unknown): value is PerceptionEventTone {
  return value === 'calm' || value === 'warm' || value === 'focus';
}
