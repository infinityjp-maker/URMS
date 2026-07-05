import type { PerceptionState, ResourceEntity } from '@urms/shared';

import { isValidEventTone } from './schedule-config.js';

export type ScheduleResourceMetadata = {
  startAt?: unknown;
  note?: unknown;
  tone?: unknown;
};

function dateKeyInTimezone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function formatEventTime(date: Date, timeZone: string): string {
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

function parseStartAt(metadata: ScheduleResourceMetadata): Date | null {
  if (typeof metadata.startAt !== 'string' || !metadata.startAt.trim()) {
    return null;
  }

  const parsed = new Date(metadata.startAt);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function mapScheduleResourceToEvent(
  resource: ResourceEntity,
  now: Date,
  timeZone: string,
): PerceptionState['nextEvents'][number] | null {
  const metadata = resource.metadata as ScheduleResourceMetadata;
  const startAt = parseStartAt(metadata);
  if (!startAt) return null;
  if (dateKeyInTimezone(startAt, timeZone) !== dateKeyInTimezone(now, timeZone)) {
    return null;
  }

  const noteFromMetadata = typeof metadata.note === 'string' ? metadata.note.trim() : '';
  const relativeNote = formatRelativeEventNote(startAt, now);
  const note = noteFromMetadata || relativeNote;

  return {
    time: formatEventTime(startAt, timeZone),
    title: resource.name,
    ...(note ? { note } : {}),
    tone: isValidEventTone(metadata.tone) ? metadata.tone : 'calm',
  };
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
