import { describe, expect, it } from 'vitest';

import { AppError, ERROR_CODES } from '@urms/shared';

import { PluginRegistry } from './plugin-registry.js';
import type { ResourceTypePlugin } from './resource-type-plugin.js';

function createTestPlugin(overrides: Partial<ResourceTypePlugin> = {}): ResourceTypePlugin {
  return {
    resourceType: 'physical',
    version: '1.0.0',
    coreVersion: '0.2.0',
    validateCreate: () => [],
    searchableFields: () => ['name'],
    ...overrides,
  };
}

describe('PluginRegistry', () => {
  it('registers compatible plugins', () => {
    const registry = new PluginRegistry('0.2.0');
    registry.register(createTestPlugin());

    expect(registry.list()).toHaveLength(1);
    expect(registry.get('physical')?.resourceType).toBe('physical');
  });

  it('rejects incompatible core major version', () => {
    const registry = new PluginRegistry('0.2.0');

    expect(() =>
      registry.register(createTestPlugin({ coreVersion: '1.0.0' })),
    ).toThrowError(expect.objectContaining({ code: ERROR_CODES.PLUGIN_INCOMPATIBLE_VERSION }));
  });

  it('throws PLUGIN_NOT_FOUND for unknown type', () => {
    const registry = new PluginRegistry('0.2.0');

    expect(() => registry.require('unknown')).toThrowError(
      expect.objectContaining({ code: ERROR_CODES.PLUGIN_NOT_FOUND }),
    );
  });
});

describe('assertPluginValidation', () => {
  it('throws PLUGIN_VALIDATION_FAILED when details exist', async () => {
    const { assertPluginValidation } = await import('./plugin-registry.js');

    expect(() =>
      assertPluginValidation('physical', [{ field: 'metadata.location', message: 'required' }]),
    ).toThrowError(expect.objectContaining({ code: ERROR_CODES.PLUGIN_VALIDATION_FAILED }));
  });
});
