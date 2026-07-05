import type { PluginValidationDetail } from '@urms/shared';

export interface ResourceTypePluginCreateInput {
  resourceId: string;
  name: string;
  metadata?: Record<string, unknown>;
}

export interface ResourceTypePluginUpdateInput {
  name?: string;
  metadata?: Record<string, unknown>;
}

export interface ResourceTypePlugin {
  readonly resourceType: string;
  readonly version: string;
  readonly coreVersion: string;
  validateCreate(input: ResourceTypePluginCreateInput): PluginValidationDetail[];
  validateUpdate?(input: ResourceTypePluginUpdateInput): PluginValidationDetail[];
  searchableFields(): string[];
}
