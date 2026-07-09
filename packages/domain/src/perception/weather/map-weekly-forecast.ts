import type { WeatherWeeklyDay, WeatherWeeklyPayload } from '@urms/shared';

import { buildWeatherHint } from './weather-hint.js';
import { resolveWeatherIllustration } from './weather-illustration.js';
import type { OpenMeteoResponse } from './open-meteo.js';

const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'] as const;

function round(value: number): number {
  return Math.round(value);
}

function weekdayLabel(dateKey: string, timeZone: string): string {
  const anchor =
    timeZone === 'Asia/Tokyo'
      ? new Date(`${dateKey}T12:00:00+09:00`)
      : new Date(`${dateKey}T12:00:00Z`);
  const weekday = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' }).format(anchor);
  const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const index = Math.max(0, labels.indexOf(weekday));
  return WEEKDAY_LABELS[index] ?? '—';
}

function buildDailySummary(tempMaxC: number, tempMinC: number, precipitationPct: number): string {
  const tempMid = round((tempMaxC + tempMinC) / 2);
  return buildWeatherHint({
    tempC: tempMid,
    precipitationPct,
    humidityPct: 60,
    windKmh: 10,
  });
}

export function mapOpenMeteoWeeklyResponse(
  payload: OpenMeteoResponse,
  timeZone: string,
): WeatherWeeklyPayload {
  const daily = payload.daily;
  if (!daily?.time?.length) {
    return { timezone: timeZone, source: 'empty', days: [] };
  }

  const days: WeatherWeeklyDay[] = [];

  for (let index = 0; index < daily.time.length; index += 1) {
    const dateKey = daily.time[index];
    if (!dateKey) {
      continue;
    }

    const tempMaxC = round(daily.temperature_2m_max?.[index] ?? 0);
    const tempMinC = round(daily.temperature_2m_min?.[index] ?? 0);
    const precipitationPct = round(daily.precipitation_probability_max?.[index] ?? 0);
    const precipitationMm = Math.round((daily.precipitation_sum?.[index] ?? 0) * 10) / 10;
    const weatherCode = daily.weather_code?.[index];
    const illustrationId = resolveWeatherIllustration(weatherCode, true, precipitationPct);

    days.push({
      dateKey,
      weekdayLabel: weekdayLabel(dateKey, timeZone),
      tempMaxC,
      tempMinC,
      precipitationPct,
      precipitationMm,
      illustrationId,
      summary: buildDailySummary(tempMaxC, tempMinC, precipitationPct),
    });
  }

  return {
    timezone: timeZone,
    source: days.length > 0 ? 'live' : 'empty',
    days,
  };
}

export function emptyWeeklyPayload(timeZone: string): WeatherWeeklyPayload {
  return { timezone: timeZone, source: 'empty', days: [] };
}
