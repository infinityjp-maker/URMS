import type { PluginValidationDetail } from '@urms/shared';
import type { ResourceTypePlugin } from '@urms/domain';

import { createLocationPlugin } from './location-plugin.js';
import { createLoopEntryPlugin } from './loop-entry-plugin.js';
import { createSchedulePlugin } from './schedule-plugin.js';
import { createSystemResourceTypePlugins } from './system-resource-plugins.js';

export { createLocationPlugin };
export { createLoopEntryPlugin };
export { createSchedulePlugin };

const CORE_VERSION = '0.2.0';
const PLUGIN_VERSION = '1.0.0';

function requireStringField(
  metadata: Record<string, unknown> | undefined,
  field: string,
  label: string,
): PluginValidationDetail[] {
  const value = metadata?.[field];
  if (typeof value !== 'string' || !value.trim()) {
    return [{ field: `metadata.${field}`, message: `${label} is required for physical resources` }];
  }

  return [];
}

export function createPhysicalPlugin(): ResourceTypePlugin {
  return {
    resourceType: 'physical',
    version: PLUGIN_VERSION,
    coreVersion: CORE_VERSION,
    searchableFields: () => ['name', 'metadata.location', 'metadata.assetTag'],
    validateCreate(input) {
      return requireStringField(input.metadata, 'location', 'location');
    },
    validateUpdate(input) {
      if (!input.metadata) {
        return [];
      }

      return requireStringField(input.metadata, 'location', 'location');
    },
  };
}

export function createDigitalPlugin(): ResourceTypePlugin {
  return {
    resourceType: 'digital',
    version: PLUGIN_VERSION,
    coreVersion: CORE_VERSION,
    searchableFields: () => ['name', 'metadata.licenseKey', 'metadata.vendor'],
    validateCreate(input) {
      return requireStringField(input.metadata, 'vendor', 'vendor');
    },
  };
}

export function createHumanPlugin(): ResourceTypePlugin {
  return {
    resourceType: 'human',
    version: PLUGIN_VERSION,
    coreVersion: CORE_VERSION,
    searchableFields: () => ['name', 'metadata.role', 'metadata.email'],
    validateCreate(input) {
      const details: PluginValidationDetail[] = [];
      const role = input.metadata?.role;
      if (typeof role !== 'string' || !role.trim()) {
        details.push({ field: 'metadata.role', message: 'role is required for human resources' });
      }
      return details;
    },
  };
}

export function createKnowledgePlugin(): ResourceTypePlugin {
  return {
    resourceType: 'knowledge',
    version: PLUGIN_VERSION,
    coreVersion: CORE_VERSION,
    searchableFields: () => ['name', 'metadata.path', 'metadata.category'],
    validateCreate(input) {
      return requireStringField(input.metadata, 'path', 'path');
    },
  };
}

export function createBuiltinResourceTypePlugins(): ResourceTypePlugin[] {
  return [
    createPhysicalPlugin(),
    createDigitalPlugin(),
    createHumanPlugin(),
    createKnowledgePlugin(),
    createSchedulePlugin(),
    createLocationPlugin(),
    createLoopEntryPlugin(),
    ...createSystemResourceTypePlugins(),
  ];
}
