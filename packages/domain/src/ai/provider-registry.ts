import type { AiCapability } from '@urms/shared';

import type { AiProviderAdapter } from './adapter.js';

export class AiProviderRegistry {
  private readonly adapters = new Map<string, AiProviderAdapter>();

  register(adapter: AiProviderAdapter): void {
    this.adapters.set(adapter.providerId, adapter);
  }

  get(providerId: string): AiProviderAdapter | undefined {
    return this.adapters.get(providerId);
  }

  list(): AiProviderAdapter[] {
    return [...this.adapters.values()];
  }

  listByCapability(capability: AiCapability): AiProviderAdapter[] {
    return this.list().filter((adapter) => adapter.supportsCapability(capability));
  }
}
