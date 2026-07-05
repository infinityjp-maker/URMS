import { AppError, ERROR_CODES } from '@urms/shared';

import type { IntegrationAdapter, IntegrationHealth, IntegrationSummary } from './integration-adapter.js';

export class IntegrationRegistry {
  private readonly adapters = new Map<string, IntegrationAdapter>();

  register(adapter: IntegrationAdapter): void {
    this.adapters.set(adapter.integrationId, adapter);
  }

  list(): IntegrationSummary[] {
    return [...this.adapters.values()].map((adapter) => ({
      integrationId: adapter.integrationId,
      name: adapter.name,
      syncSupported: typeof adapter.sync === 'function',
    }));
  }

  require(integrationId: string): IntegrationAdapter {
    const adapter = this.adapters.get(integrationId);
    if (!adapter) {
      throw new AppError(ERROR_CODES.INTEGRATION_NOT_FOUND, `Integration not found: ${integrationId}`);
    }
    return adapter;
  }

  async healthCheck(integrationId: string): Promise<IntegrationHealth> {
    return this.require(integrationId).healthCheck();
  }

  async sync(integrationId: string, actorId: string): Promise<unknown> {
    const adapter = this.require(integrationId);
    if (!adapter.sync) {
      throw new AppError(ERROR_CODES.INTEGRATION_SYNC_UNSUPPORTED, `Sync not supported: ${integrationId}`);
    }
    return adapter.sync(actorId);
  }
}
