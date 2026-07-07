import { describe, expect, it, vi } from 'vitest';

import { ERROR_CODES } from '@urms/shared';

import { IntegrationRegistry } from './integration-registry.js';

describe('IntegrationRegistry', () => {
  it('lists registered integrations', () => {
    const registry = new IntegrationRegistry();
    registry.register({
      integrationId: 'cursor-local',
      name: 'Cursor',
      healthCheck: vi.fn(async () => ({
        integrationId: 'cursor-local',
        healthy: true,
        detail: 'ok',
      })),
      sync: vi.fn(async () => ({ created: 1 })),
    });

    expect(registry.list()).toEqual([
      {
        integrationId: 'cursor-local',
        name: 'Cursor',
        syncSupported: true,
        exportSupported: false,
      },
    ]);
  });

  it('exports through registered adapter', async () => {
    const exportFn = vi.fn(async () => ({ updated: 1, unchanged: 0, skipped: 0, items: [] }));
    const registry = new IntegrationRegistry();
    registry.register({
      integrationId: 'cursor-local',
      name: 'Cursor',
      healthCheck: vi.fn(async () => ({
        integrationId: 'cursor-local',
        healthy: true,
        detail: 'ok',
      })),
      export: exportFn,
    });

    const report = await registry.export('cursor-local', 'developer');
    expect(report).toEqual({ updated: 1, unchanged: 0, skipped: 0, items: [] });
    expect(exportFn).toHaveBeenCalledWith('developer');
  });

  it('throws when integration is missing', () => {
    const registry = new IntegrationRegistry();
    expect(() => registry.require('missing')).toThrow(
      expect.objectContaining({ code: ERROR_CODES.INTEGRATION_NOT_FOUND }),
    );
  });
});
