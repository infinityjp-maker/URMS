import {
  AppError,
  ERROR_CODES,
  isCoreVersionCompatible,
  type ResourceTypePluginInfo,
} from '@urms/shared';

import type { ResourceTypePlugin } from './resource-type-plugin.js';

export class PluginRegistry {
  private readonly plugins = new Map<string, ResourceTypePlugin>();

  constructor(private readonly appCoreVersion: string) {}

  register(plugin: ResourceTypePlugin): void {
    if (!isCoreVersionCompatible(plugin.coreVersion, this.appCoreVersion)) {
      throw new AppError(
        ERROR_CODES.PLUGIN_INCOMPATIBLE_VERSION,
        `Plugin ${plugin.resourceType} requires core ${plugin.coreVersion}, app is ${this.appCoreVersion}`,
      );
    }

    this.plugins.set(plugin.resourceType, plugin);
  }

  get(resourceType: string): ResourceTypePlugin | undefined {
    return this.plugins.get(resourceType);
  }

  require(resourceType: string): ResourceTypePlugin {
    const plugin = this.get(resourceType);
    if (!plugin) {
      throw new AppError(ERROR_CODES.PLUGIN_NOT_FOUND, `No plugin for resource type: ${resourceType}`);
    }

    return plugin;
  }

  list(): ResourceTypePluginInfo[] {
    return [...this.plugins.values()].map((plugin) => ({
      resourceType: plugin.resourceType,
      version: plugin.version,
      coreVersion: plugin.coreVersion,
      searchableFields: plugin.searchableFields(),
    }));
  }
}

export function assertPluginValidation(
  resourceType: string,
  details: ReturnType<ResourceTypePlugin['validateCreate']>,
): void {
  if (details.length === 0) {
    return;
  }

  throw new AppError(
    ERROR_CODES.PLUGIN_VALIDATION_FAILED,
    `Plugin validation failed for ${resourceType}`,
    details,
  );
}
