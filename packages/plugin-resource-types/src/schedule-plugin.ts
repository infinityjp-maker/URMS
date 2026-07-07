import type { PluginValidationDetail } from '@urms/shared';
import { URMS_CORE_VERSION } from '@urms/shared';
import type { ResourceTypePlugin } from '@urms/domain';

const CORE_VERSION = URMS_CORE_VERSION;
const PLUGIN_VERSION = '1.0.0';

function invalidStartAt(): PluginValidationDetail[] {
  return [{ field: 'metadata.startAt', message: 'startAt must be a valid ISO datetime for schedule resources' }];
}

export function createSchedulePlugin(): ResourceTypePlugin {
  return {
    resourceType: 'schedule',
    version: PLUGIN_VERSION,
    coreVersion: CORE_VERSION,
    searchableFields: () => ['name', 'metadata.note'],
    validateCreate(input) {
      const startAt = input.metadata?.startAt;
      if (typeof startAt !== 'string' || Number.isNaN(Date.parse(startAt))) {
        return invalidStartAt();
      }

      return [];
    },
    validateUpdate(input) {
      if (!input.metadata || !('startAt' in input.metadata)) {
        return [];
      }

      const startAt = input.metadata.startAt;
      if (typeof startAt !== 'string' || Number.isNaN(Date.parse(startAt))) {
        return invalidStartAt();
      }

      return [];
    },
  };
}
