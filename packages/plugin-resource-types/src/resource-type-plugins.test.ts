import { describe, expect, it } from 'vitest';

import { PluginRegistry } from '@urms/domain';

import { createBuiltinResourceTypePlugins, createPhysicalPlugin } from './resource-type-plugins.js';

describe('resource type plugins', () => {
  it('registers all builtin plugins', () => {
    const registry = new PluginRegistry('0.2.0');
    for (const plugin of createBuiltinResourceTypePlugins()) {
      registry.register(plugin);
    }

    expect(registry.list()).toHaveLength(4);
  });

  it('validates physical metadata.location', () => {
    const plugin = createPhysicalPlugin();
    const details = plugin.validateCreate({
      resourceId: 'rack-a01',
      name: 'Rack A01',
      metadata: {},
    });

    expect(details).toHaveLength(1);
    expect(details[0]?.field).toBe('metadata.location');
  });
});
