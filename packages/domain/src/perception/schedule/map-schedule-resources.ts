import type { PerceptionState, ResourceEntity } from '@urms/shared';

import { isValidEventTone } from './schedule-config.js';

export type ScheduleResourceMetadata = {
  startAt?: unknown;
  recurrence?: unknown;
  time?: unknown;
  timezone?: unknown;
  note?: unknown;
  tone?: unknown;
};

export type MappedScheduleEvent = PerceptionState['nextEvents'][number] & {
  readonly resourceId: string;
  readonly startAt: Date;
};

export function dateKeyInTimezone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function formatEventTime(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('ja-JP', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const hour = parts.find((part) => part.type === 'hour')?.value ?? '00';
  const minute = parts.find((part) => part.type === 'minute')?.value ?? '00';
  return `${hour}:${minute}`;
}

export function formatRelativeEventNote(start: Date, now: Date): string | undefined {
  const diffMs = start.getTime() - now.getTime();
  if (diffMs <= 0) return undefined;

  const totalMinutes = Math.round(diffMs / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `あと ${hours}h ${minutes}m`;
  }

  return `あと ${minutes}m`;
}

function parseDailyTime(value: string): { hour: number; minute: number } | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;

  const hour = Number.parseInt(match[1] ?? '', 10);
  const minute = Number.parseInt(match[2] ?? '', 10);
  if (!Number.isFinite(hour) || !Number.isFinite(minute) || hour > 23 || minute > 59) {
    return null;
  }

  return { hour, minute };
}

export function buildDailyOccurrence(now: Date, time: string, timeZone: string): Date | null {
  return buildDailyOccurrenceForDate(now, time, timeZone);
}

export function buildDailyOccurrenceForDate(targetDate: Date, time: string, timeZone: string): Date | null {
  const parsed = parseDailyTime(time);
  if (!parsed) return null;

  const dateKey = dateKeyInTimezone(targetDate, timeZone);
  const hh = String(parsed.hour).padStart(2, '0');
  const mm = String(parsed.minute).padStart(2, '0');

  if (timeZone === 'Asia/Tokyo') {
    return new Date(`${dateKey}T${hh}:${mm}:00+09:00`);
  }

  return new Date(`${dateKey}T${hh}:${mm}:00Z`);
}

function resolveEventTimeZone(metadata: ScheduleResourceMetadata, fallbackTimeZone: string): string {
  return typeof metadata.timezone === 'string' && metadata.timezone.trim()
    ? metadata.timezone.trim()
    : fallbackTimeZone;
}

function parseStartAtForDate(
  metadata: ScheduleResourceMetadata,
  targetDate: Date,
  timeZone: string,
): Date | null {
  if (typeof metadata.startAt === 'string' && metadata.startAt.trim()) {
    const parsed = new Date(metadata.startAt);
    if (Number.isNaN(parsed.getTime())) return null;
    if (dateKeyInTimezone(parsed, timeZone) !== dateKeyInTimezone(targetDate, timeZone)) {
      return null;
    }
    return parsed;
  }

  if (metadata.recurrence === 'daily' && typeof metadata.time === 'string') {
    const eventTimeZone = resolveEventTimeZone(metadata, timeZone);
    return buildDailyOccurrenceForDate(targetDate, metadata.time, eventTimeZone);
  }

  return null;
}

export function dateFromDateKey(dateKey: string, timeZone: string): Date {
  if (timeZone === 'Asia/Tokyo') {
    return new Date(`${dateKey}T12:00:00+09:00`);
  }

  const [yearText, monthText, dayText] = dateKey.split('-');
  const year = Number.parseInt(yearText ?? '', 10);
  const month = Number.parseInt(monthText ?? '', 10);
  const day = Number.parseInt(dayText ?? '', 10);
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

export function buildMonthDateKeys(year: number, month: number): string[] {
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const keys: string[] = [];

  for (let day = 1; day <= lastDay; day += 1) {
    keys.push(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
  }

  return keys;
}

export function mapScheduleResourceToMappedEventOnDate(
  resource: ResourceEntity,
  targetDate: Date,
  now: Date,
  timeZone: string,
): MappedScheduleEvent | null {
  const metadata = resource.metadata as ScheduleResourceMetadata;
  const startAt = parseStartAtForDate(metadata, targetDate, timeZone);
  if (!startAt) return null;

  const noteFromMetadata = typeof metadata.note === 'string' ? metadata.note.trim() : '';
  const relativeNote = formatRelativeEventNote(startAt, now);
  const note = noteFromMetadata || relativeNote;

  return {
    time: formatEventTime(startAt, timeZone),
    title: resource.name,
    ...(note ? { note } : {}),
    tone: isValidEventTone(metadata.tone) ? metadata.tone : 'calm',
    resourceId: resource.resourceId,
    startAt,
  };
}

export function mapScheduleResourceToEvent(
  resource: ResourceEntity,
  now: Date,
  timeZone: string,
): PerceptionState['nextEvents'][number] | null {
  const mapped = mapScheduleResourceToMappedEventOnDate(resource, now, now, timeZone);
  if (!mapped) return null;

  const { resourceId: _resourceId, startAt: _startAt, ...event } = mapped;
  return event;
}

export function mapScheduleResourcesToEvents(
  resources: ResourceEntity[],
  now: Date,
  timeZone: string,
  limit: number,
): PerceptionState['nextEvents'] {
  return resources
    .map((resource) => mapScheduleResourceToEvent(resource, now, timeZone))
    .filter((event): event is PerceptionState['nextEvents'][number] => event !== null)
    .sort((left, right) => left.time.localeCompare(right.time, 'ja-JP'))
    .slice(0, limit);
}

export function mapScheduleResourcesForDate(
  resources: ResourceEntity[],
  targetDate: Date,
  now: Date,
  timeZone: string,
): MappedScheduleEvent[] {
  return resources
    .map((resource) => mapScheduleResourceToMappedEventOnDate(resource, targetDate, now, timeZone))
    .filter((event): event is MappedScheduleEvent => event !== null)
    .sort((left, right) => left.time.localeCompare(right.time, 'ja-JP'));
}

export function mapScheduleResourcesForMonth(
  resources: ResourceEntity[],
  year: number,
  month: number,
  now: Date,
  timeZone: string,
): Record<string, MappedScheduleEvent[]> {
  const keys = buildMonthDateKeys(year, month);
  const days: Record<string, MappedScheduleEvent[]> = {};

  for (const dateKey of keys) {
    const targetDate = dateFromDateKey(dateKey, timeZone);
    days[dateKey] = mapScheduleResourcesForDate(resources, targetDate, now, timeZone);
  }

  return days;
}
