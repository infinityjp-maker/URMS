import { URMS_CORE_VERSION } from '@urms/shared';
import type { ResourceTypePlugin } from '@urms/domain';

const CORE_VERSION = URMS_CORE_VERSION;
const PLUGIN_VERSION = '1.0.0';

function createPassthroughPlugin(resourceType: string): ResourceTypePlugin {
  return {
    resourceType,
    version: PLUGIN_VERSION,
    coreVersion: CORE_VERSION,
    searchableFields: () => ['name', 'metadata.sourcePath'],
    validateCreate: () => [],
    validateUpdate: () => [],
  };
}

export function createSystemResourceTypePlugins(): ResourceTypePlugin[] {
  return [
    createPassthroughPlugin('role'),
    createPassthroughPlugin('rule'),
    createPassthroughPlugin('command'),
    createPassthroughPlugin('skill'),
    createPassthroughPlugin('team'),
    createPassthroughPlugin('decision'),
    createPassthroughPlugin('context'),
  ];
}
