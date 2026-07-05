import {
  AppError,
  ERROR_CODES,
  type AiChatRequest,
  type AiChatResponse,
  type AiProviderHealth,
  type AiProviderInfo,
  type UrmsMode,
} from '@urms/shared';

import type { AiProviderAdapter } from './adapter.js';
import type { AiUsageRepository } from './ai-usage-repository.js';
import { AiCostTracker } from './cost-tracker.js';
import { AiProviderRegistry } from './provider-registry.js';

export interface AiManagerOptions {
  defaultProviderId?: string;
  fallbackProviderIds?: string[];
}

export class AiManager {
  private readonly costTracker: AiCostTracker;

  constructor(
    private readonly registry: AiProviderRegistry,
    usageRepository: AiUsageRepository,
    private readonly options: AiManagerOptions = {},
  ) {
    this.costTracker = new AiCostTracker(usageRepository);
  }

  listProviders(): AiProviderInfo[] {
    return this.registry.list().map((adapter) => ({
      providerId: adapter.providerId,
      capabilities: adapter.getCapabilities(),
    }));
  }

  async healthCheck(providerId: string): Promise<AiProviderHealth> {
    const adapter = this.requireProvider(providerId);
    return adapter.healthCheck();
  }

  async chat(
    request: AiChatRequest,
    actorId: string,
    mode: UrmsMode,
  ): Promise<AiChatResponse> {
    const chain = this.buildProviderChain(request.providerId);
    let lastError: unknown;

    for (const providerId of chain) {
      const adapter = this.requireProvider(providerId);
      if (!adapter.supportsCapability('chat')) {
        continue;
      }

      try {
        const response = await adapter.chat(request);
        await this.costTracker.record(response, { actorId, mode });
        return response;
      } catch (error) {
        lastError = error;
      }
    }

    if (lastError instanceof AppError) {
      throw lastError;
    }

    throw new AppError(ERROR_CODES.AI_PROVIDER_UNAVAILABLE, 'All AI providers failed');
  }

  private buildProviderChain(preferredProviderId?: string): string[] {
    const chain: string[] = [];

    if (preferredProviderId) {
      chain.push(preferredProviderId);
    }

    if (this.options.defaultProviderId && !chain.includes(this.options.defaultProviderId)) {
      chain.push(this.options.defaultProviderId);
    }

    for (const providerId of this.options.fallbackProviderIds ?? []) {
      if (!chain.includes(providerId)) {
        chain.push(providerId);
      }
    }

    return chain;
  }

  private requireProvider(providerId: string): AiProviderAdapter {
    const adapter = this.registry.get(providerId);
    if (!adapter) {
      throw new AppError(ERROR_CODES.AI_PROVIDER_UNAVAILABLE, `Provider not found: ${providerId}`);
    }

    return adapter;
  }
}
