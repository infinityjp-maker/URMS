import type { PluginValidationDetail } from '@urms/shared';
import { URMS_CORE_VERSION } from '@urms/shared';
import type { ResourceTypePlugin } from '@urms/domain';

const CORE_VERSION = URMS_CORE_VERSION;
const PLUGIN_VERSION = '1.0.0';

function requireStringField(
  metadata: Record<string, unknown> | undefined,
  field: string,
  label: string,
): PluginValidationDetail[] {
  const value = metadata?.[field];
  if (typeof value !== 'string' || !value.trim()) {
    return [{ field: `metadata.${field}`, message: `${label} is required for loop-entry resources` }];
  }

  return [];
}

export function createLoopEntryPlugin(): ResourceTypePlugin {
  return {
    resourceType: 'loop-entry',
    version: PLUGIN_VERSION,
    coreVersion: CORE_VERSION,
    searchableFields: () => ['name', 'metadata.completed', 'metadata.next'],
    validateCreate(input) {
      const details = [
        ...requireStringField(input.metadata, 'completed', 'completed'),
        ...requireStringField(input.metadata, 'actorId', 'actorId'),
        ...requireStringField(input.metadata, 'occurredAt', 'occurredAt'),
      ];

      const occurredAt = input.metadata?.occurredAt;
      if (typeof occurredAt === 'string' && Number.isNaN(Date.parse(occurredAt))) {
        details.push({
          field: 'metadata.occurredAt',
          message: 'occurredAt must be a valid ISO datetime for loop-entry resources',
        });
      }

      return details;
    },
  };
}
