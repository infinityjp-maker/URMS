import type { PerceptionState, UrmsMode } from '@urms/shared';

import type { ResourceService } from '../../resource/resource-service.js';
import { PERCEPTION_FIXTURES } from '../fixtures.js';
import { mapScheduleResourcesToEvents } from './map-schedule-resources.js';
import { resolveScheduleConfig, SCHEDULE_RESOURCE_TYPE, type ScheduleConfig } from './schedule-config.js';

export interface ScheduleService {
  getTodayEvents(mode: UrmsMode, now?: Date): Promise<PerceptionState['nextEvents']>;
}

export type ScheduleServiceOptions = {
  resourceService: ResourceService;
  config?: ScheduleConfig;
};

export class ResourceScheduleService implements ScheduleService {
  private readonly resourceService: ResourceService;
  private readonly config: ScheduleConfig;

  constructor(options: ScheduleServiceOptions) {
    this.resourceService = options.resourceService;
    this.config = options.config ?? resolveScheduleConfig();
  }

  async getTodayEvents(mode: UrmsMode, now = new Date()): Promise<PerceptionState['nextEvents']> {
    if (!this.config.enabled) {
      return PERCEPTION_FIXTURES.nextEvents;
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
      return PERCEPTION_FIXTURES.nextEvents;
    }
  }
}

export function createScheduleService(options: ScheduleServiceOptions): ScheduleService {
  return new ResourceScheduleService(options);
}
