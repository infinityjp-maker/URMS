import type { CalendarMonthEvent } from '@urms/shared';

import { adviseEventLeadTime, resolveScheduleEventCategory } from '../event-lead-time.js';
import { dateKeyInTimezone, formatEventTime } from '../map-schedule-resources.js';
import type { ParsedIcsEvent } from './parse-ics.js';

function eventTone(title: string, note?: string): CalendarMonthEvent['tone'] {
  const category = resolveScheduleEventCategory(title, note);
  if (category === 'outgoing') return 'focus';
  if (category === 'reservation') return 'warm';
  return 'calm';
}

export function mapGoogleEventsToMonthDays(
  events: readonly ParsedIcsEvent[],
  now: Date,
  timeZone: string,
): Record<string, CalendarMonthEvent[]> {
  const days: Record<string, CalendarMonthEvent[]> = {};

  for (const event of events) {
    const dateKey = dateKeyInTimezone(event.startAt, timeZone);
    const category = resolveScheduleEventCategory(event.title, event.note);
    const leadAdvice = adviseEventLeadTime(category, event.startAt, now);
    const mapped: CalendarMonthEvent = {
      time: formatEventTime(event.startAt, timeZone),
      title: event.title,
      ...(event.note ? { note: event.note } : { note: 'Google カレンダー' }),
      tone: eventTone(event.title, event.note),
      resourceId: `google:${event.uid}`,
      category,
      ...(leadAdvice ? { leadAdvice } : {}),
    };

    const bucket = days[dateKey] ?? [];
    bucket.push(mapped);
    days[dateKey] = bucket;
  }

  for (const dateKey of Object.keys(days)) {
    days[dateKey]?.sort((left, right) => left.time.localeCompare(right.time, 'ja-JP'));
  }

  return days;
}

export function mergeCalendarMonthDays(
  localDays: Record<string, CalendarMonthEvent[]>,
  googleDays: Record<string, CalendarMonthEvent[]>,
): Record<string, CalendarMonthEvent[]> {
  const merged: Record<string, CalendarMonthEvent[]> = { ...localDays };
  const dateKeys = new Set([...Object.keys(localDays), ...Object.keys(googleDays)]);

  for (const dateKey of dateKeys) {
    const combined = [...(localDays[dateKey] ?? []), ...(googleDays[dateKey] ?? [])];
    combined.sort((left, right) => left.time.localeCompare(right.time, 'ja-JP'));
    merged[dateKey] = combined;
  }

  return merged;
}
