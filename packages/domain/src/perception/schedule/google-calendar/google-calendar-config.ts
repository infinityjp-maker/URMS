export type GoogleCalendarConfig = {
  enabled: boolean;
  icsUrl: string | null;
  timezone: string;
  timeoutMs: number;
};

const DEFAULT_TIMEZONE = 'Asia/Tokyo';

function parseEnabled(value: string | undefined, nodeEnv: string | undefined): boolean {
  if (value?.trim().toLowerCase() === 'false') return false;
  if (value?.trim().toLowerCase() === 'true') return true;
  return nodeEnv !== 'test';
}

/** v0.2 S3 後半 — 公開 ICS フィード（API キー不要） */
export function resolveGoogleCalendarConfig(env: NodeJS.ProcessEnv = process.env): GoogleCalendarConfig {
  const icsUrl = env.URMS_GOOGLE_CALENDAR_ICS_URL?.trim() || null;
  const enabled = parseEnabled(env.URMS_GOOGLE_CALENDAR_ENABLED, env.NODE_ENV) && Boolean(icsUrl);

  return {
    enabled,
    icsUrl,
    timezone:
      env.URMS_GOOGLE_CALENDAR_TIMEZONE?.trim() ||
      env.URMS_SCHEDULE_TIMEZONE?.trim() ||
      DEFAULT_TIMEZONE,
    timeoutMs: 5_000,
  };
}
