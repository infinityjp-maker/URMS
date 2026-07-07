import type { PluginValidationDetail } from '@urms/shared';
import { URMS_CORE_VERSION } from '@urms/shared';
import type { ResourceTypePlugin } from '@urms/domain';

const CORE_VERSION = URMS_CORE_VERSION;
const PLUGIN_VERSION = '1.0.0';

function parseCoordinate(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function invalidCoordinates(): PluginValidationDetail[] {
  return [{ field: 'metadata.latitude', message: 'latitude and longitude are required for location resources' }];
}

export function createLocationPlugin(): ResourceTypePlugin {
  return {
    resourceType: 'location',
    version: PLUGIN_VERSION,
    coreVersion: CORE_VERSION,
    searchableFields: () => ['name', 'metadata.timezone'],
    validateCreate(input) {
      const latitude = parseCoordinate(input.metadata?.latitude);
      const longitude = parseCoordinate(input.metadata?.longitude);
      if (latitude === null || longitude === null) {
        return invalidCoordinates();
      }
      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        return invalidCoordinates();
      }
      return [];
    },
    validateUpdate(input) {
      if (!input.metadata) {
        return [];
      }
      if (!('latitude' in input.metadata) && !('longitude' in input.metadata)) {
        return [];
      }
      return createLocationPlugin().validateCreate({
        resourceId: 'location-update',
        name: input.name ?? 'location',
        metadata: input.metadata,
      });
    },
  };
}
