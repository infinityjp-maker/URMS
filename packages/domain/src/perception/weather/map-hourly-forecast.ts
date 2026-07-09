import type { WeatherHourlyPayload, WeatherHourlySlot } from '@urms/shared';

import type { OpenMeteoResponse } from './open-meteo.js';

const DISPLAY_SLOT_COUNT = 6;

function round(value: number): number {
  return Math.round(value);
}

function formatHourLabel(isoTime: string, timeZone: string): string {
  const date = isoTime.includes('T') ? new Date(isoTime) : new Date(`${isoTime}T12:00:00`);
  return new Intl.DateTimeFormat('ja-JP', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

function pickDisplaySlots(
  times: readonly string[],
  precipitation: readonly number[],
  temperatures: readonly number[],
  timeZone: string,
  now: Date,
): WeatherHourlySlot[] {
  const slots: WeatherHourlySlot[] = [];
  const nowMs = now.getTime();

  for (let index = 0; index < times.length; index += 1) {
    const isoTime = times[index];
    if (!isoTime) {
      continue;
    }

    const slotDate = new Date(isoTime.includes('T') ? isoTime : `${isoTime}T00:00:00`);
    if (slotDate.getTime() < nowMs - 60 * 60 * 1000) {
      continue;
    }

    slots.push({
      time: formatHourLabel(isoTime, timeZone),
      precipitationPct: round(precipitation[index] ?? 0),
      tempC: round(temperatures[index] ?? 0),
    });

    if (slots.length >= DISPLAY_SLOT_COUNT) {
      break;
    }
  }

  return slots;
}

export function mapOpenMeteoHourlyResponse(
  payload: OpenMeteoResponse,
  timeZone: string,
  now = new Date(),
): WeatherHourlyPayload {
  const hourly = payload.hourly;
  if (!hourly?.time?.length) {
    return { timezone: timeZone, source: 'empty', slots: [] };
  }

  const slots = pickDisplaySlots(
    hourly.time,
    hourly.precipitation_probability ?? [],
    hourly.temperature_2m ?? [],
    timeZone,
    now,
  );

  return {
    timezone: timeZone,
    source: slots.length > 0 ? 'live' : 'empty',
    slots,
  };
}

export function emptyHourlyPayload(timeZone: string): WeatherHourlyPayload {
  return { timezone: timeZone, source: 'empty', slots: [] };
}
