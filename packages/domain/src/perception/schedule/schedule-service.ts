import type { CalendarMonthEvent, CalendarMonthPayload, UrmsMode } from '@urms/shared';

import type { ResourceService } from '../../resource/resource-service.js';
import { adviseEventLeadTime, resolveScheduleEventCategory } from './event-lead-time.js';
import {
  buildMonthDateKeys,
  mapScheduleResourcesForMonth,
  mapScheduleResourcesToEvents,
  type MappedScheduleEvent,
} from './map-schedule-resources.js';
import { resolveScheduleConfig, SCHEDULE_RESOURCE_TYPE, type ScheduleConfig } from './schedule-config.js';
import { mergeCalendarMonthDays } from './google-calendar/map-google-events.js';
import type { GoogleCalendarService } from './google-calendar/google-calendar-service.js';

const MONTH_FETCH_LIMIT = 64;

export interface ScheduleService {
  getTodayEvents(mode: UrmsMode, now?: Date): Promise<import('@urms/shared').PerceptionState['nextEvents']>;
  getMonthEvents(mode: UrmsMode, year: number, month: number, now?: Date): Promise<CalendarMonthPayload>;
}

export type ScheduleServiceOptions = {
  resourceService: ResourceService;
  config?: ScheduleConfig;
  googleCalendarService?: import('./google-calendar/google-calendar-service.js').GoogleCalendarService;
};

function emptyMonthPayload(year: number, month: number, timezone: string): CalendarMonthPayload {
  const days: Record<string, CalendarMonthEvent[]> = {};
  for (const dateKey of buildMonthDateKeys(year, month)) {
    days[dateKey] = [];
  }

  return {
    year,
    month,
    timezone,
    googleConnected: false,
    days,
  };
}

function toCalendarMonthEvent(mapped: MappedScheduleEvent, now: Date): CalendarMonthEvent {
  const category = resolveScheduleEventCategory(mapped.title, mapped.note, mapped.tone);
  const leadAdvice = adviseEventLeadTime(category, mapped.startAt, now);

  return {
    time: mapped.time,
    title: mapped.title,
    ...(mapped.note ? { note: mapped.note } : {}),
    tone: mapped.tone,
    resourceId: mapped.resourceId,
    category,
    ...(leadAdvice ? { leadAdvice } : {}),
  };
}

export class ResourceScheduleService implements ScheduleService {
  private readonly resourceService: ResourceService;
  private readonly config: ScheduleConfig;
  private readonly googleCalendarService?: GoogleCalendarService;

  constructor(options: ScheduleServiceOptions) {
    this.resourceService = options.resourceService;
    this.config = options.config ?? resolveScheduleConfig();
    this.googleCalendarService = options.googleCalendarService;
  }

  async getTodayEvents(mode: UrmsMode, now = new Date()) {
    if (!this.config.enabled) {
      return [];
    }

    try {
      const { items } = await this.resourceService.list(
        {
          resourceType: SCHEDULE_RESOURCE_TYPE,
          status: 'active',
          limit: this.config.limit,
        },
        mode,
      );

      return mapScheduleResourcesToEvents(items, now, this.config.timezone, this.config.limit);
    } catch {
      return [];
    }
  }

  async getMonthEvents(mode: UrmsMode, year: number, month: number, now = new Date()): Promise<CalendarMonthPayload> {
    if (!this.config.enabled) {
      return emptyMonthPayload(year, month, this.config.timezone);
    }

    try {
      const fetchLimit = Math.max(this.config.limit, MONTH_FETCH_LIMIT);
      const { items } = await this.resourceService.list(
        {
          resourceType: SCHEDULE_RESOURCE_TYPE,
          status: 'active',
          limit: fetchLimit,
        },
        mode,
      );

      const mappedDays = mapScheduleResourcesForMonth(items, year, month, now, this.config.timezone);
      const days: Record<string, CalendarMonthEvent[]> = {};

      for (const [dateKey, events] of Object.entries(mappedDays)) {
        days[dateKey] = events.map((event) => toCalendarMonthEvent(event, now));
      }

      const google = this.googleCalendarService
        ? await this.googleCalendarService.getMonthEvents(year, month, now)
        : { connected: false, statusNote: null, days: {} };

      const mergedDays = mergeCalendarMonthDays(days, google.days);

      return {
        year,
        month,
        timezone: this.config.timezone,
        googleConnected: google.connected,
        days: mergedDays,
      };
    } catch {
      return emptyMonthPayload(year, month, this.config.timezone);
    }
  }
}

export function createScheduleService(options: ScheduleServiceOptions): ScheduleService {
  return new ResourceScheduleService(options);
}
