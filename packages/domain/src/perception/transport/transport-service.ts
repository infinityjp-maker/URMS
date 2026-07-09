import type { TransportDeparturePayload, UrmsMode } from '@urms/shared';

import type { ResourceService } from '../../resource/resource-service.js';
import { resolveScheduleEventCategory } from '../schedule/event-lead-time.js';
import {
  mapScheduleResourcesForDate,
  type MappedScheduleEvent,
} from '../schedule/map-schedule-resources.js';
import { resolveScheduleConfig, SCHEDULE_RESOURCE_TYPE } from '../schedule/schedule-config.js';
import {
  adviseDeparture,
} from './departure-advice.js';
import { adviseRoute } from './route-advice.js';
import { resolveStationDepartures } from './station-departure-provider.js';
import { resolveTransportConfig, type TransportConfig } from './transport-config.js';

const SCHEDULE_FETCH_LIMIT = 32;

export interface TransportService {
  getDepartureAdvice(mode: UrmsMode, now?: Date): Promise<TransportDeparturePayload>;
}

export type TransportServiceOptions = {
  resourceService: ResourceService;
  config?: TransportConfig;
};

function emptyPayload(timezone: string, stationName: string): TransportDeparturePayload {
  return {
    timezone,
    stationName,
    advice: null,
    route: null,
    timetableSource: 'interval',
    note: '本日の外出/通勤予定がありません',
  };
}

function pickNextOutgoingEvent(events: MappedScheduleEvent[], now: Date): MappedScheduleEvent | undefined {
  return events
    .filter((event) => {
      if (event.startAt.getTime() <= now.getTime()) return false;
      return resolveScheduleEventCategory(event.title, event.note, event.tone) === 'outgoing';
    })
    .sort((left, right) => left.startAt.getTime() - right.startAt.getTime())[0];
}

export class ResourceTransportService implements TransportService {
  private readonly resourceService: ResourceService;
  private readonly config: TransportConfig;

  constructor(options: TransportServiceOptions) {
    this.resourceService = options.resourceService;
    this.config = options.config ?? resolveTransportConfig();
  }

  async getDepartureAdvice(mode: UrmsMode, now = new Date()): Promise<TransportDeparturePayload> {
    if (!this.config.enabled) {
      return {
        timezone: this.config.timezone,
        stationName: this.config.stationName,
        advice: null,
        route: null,
        timetableSource: 'interval',
        note: '交通モジュールは無効です（URMS_TRANSPORT_ENABLED=false）',
      };
    }

    const scheduleConfig = resolveScheduleConfig();
    if (!scheduleConfig.enabled) {
      return {
        timezone: this.config.timezone,
        stationName: this.config.stationName,
        advice: null,
        route: null,
        timetableSource: 'interval',
        note: 'schedule SSOT が無効のため予定を参照できません',
      };
    }

    try {
      const { items } = await this.resourceService.list(
        {
          resourceType: SCHEDULE_RESOURCE_TYPE,
          status: 'active',
          limit: SCHEDULE_FETCH_LIMIT,
        },
        mode,
      );

      const mapped = mapScheduleResourcesForDate(items, now, now, scheduleConfig.timezone);
      const nextOutgoing = pickNextOutgoingEvent(mapped, now);
      if (!nextOutgoing) {
        return emptyPayload(this.config.timezone, this.config.stationName);
      }

      const { departures: stationDepartures, source: timetableSource } = await resolveStationDepartures({
        config: this.config,
        targetDate: now,
      });

      const advice = adviseDeparture({
        eventTitle: nextOutgoing.title,
        eventStart: nextOutgoing.startAt,
        now,
        stationDepartures,
        config: this.config,
      });

      if (!advice) {
        return {
          timezone: this.config.timezone,
          stationName: this.config.stationName,
          advice: null,
          route: null,
          timetableSource,
          note: '有効な駅発時刻が見つかりません（予定が近すぎる可能性）',
        };
      }

      const route = adviseRoute({
        departure: advice,
        eventStart: nextOutgoing.startAt,
        config: this.config,
      });

      return {
        timezone: this.config.timezone,
        stationName: this.config.stationName,
        advice,
        route: route ?? null,
        timetableSource,
        note: null,
      };
    } catch {
      return {
        timezone: this.config.timezone,
        stationName: this.config.stationName,
        advice: null,
        route: null,
        timetableSource: 'interval',
        note: '交通アドバイスを取得できませんでした',
      };
    }
  }
}

export function createTransportService(options: TransportServiceOptions): TransportService {
  return new ResourceTransportService(options);
}
