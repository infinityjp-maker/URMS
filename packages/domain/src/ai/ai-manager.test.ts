import { describe, expect, it, vi } from 'vitest';

import type { AiChatRequest, AiChatResponse, AiProviderHealth } from '@urms/shared';

import type { AiProviderAdapter } from './adapter.js';
import { AiManager } from './ai-manager.js';
import { InMemoryAiUsageRepository } from './ai-usage-repository.js';
import { AiProviderRegistry } from './provider-registry.js';

function createMockAdapter(
  providerId: string,
  behavior: Partial<AiProviderAdapter> = {},
): AiProviderAdapter {
  return {
    providerId,
    getCapabilities: () => ['chat'],
    supportsCapability: () => true,
    chat: vi.fn(async (request: AiChatRequest): Promise<AiChatResponse> => ({
      content: `reply from ${providerId}`,
      providerId,
      modelId: request.modelId,
      usage: { promptTokens: 1, completionTokens: 2, totalTokens: 3 },
      latencyMs: 10,
    })),
    healthCheck: vi.fn(async (): Promise<AiProviderHealth> => ({
      providerId,
      healthy: true,
    })),
    ...behavior,
  };
}

describe('AiManager', () => {
  it('lists registered providers', () => {
    const registry = new AiProviderRegistry();
    registry.register(createMockAdapter('ollama'));

    const manager = new AiManager(registry, new InMemoryAiUsageRepository());
    expect(manager.listProviders()).toEqual([{ providerId: 'ollama', capabilities: ['chat'] }]);
  });

  it('records usage after chat', async () => {
    const registry = new AiProviderRegistry();
    registry.register(createMockAdapter('ollama'));
    const usageRepo = new InMemoryAiUsageRepository();
    const manager = new AiManager(registry, usageRepo, { defaultProviderId: 'ollama' });

    const response = await manager.chat(
      {
        modelId: 'llama3.2',
        messages: [{ role: 'user', content: 'hello' }],
      },
      'dev-user',
      'plan',
    );

    expect(response.content).toContain('ollama');
    expect(usageRepo.getAll()).toHaveLength(1);
  });

  it('falls back when primary provider fails', async () => {
    const registry = new AiProviderRegistry();
    registry.register(
      createMockAdapter('broken', {
        chat: vi.fn(async () => {
          throw new Error('down');
        }),
      }),
    );
    registry.register(createMockAdapter('ollama'));

    const manager = new AiManager(registry, new InMemoryAiUsageRepository(), {
      defaultProviderId: 'broken',
      fallbackProviderIds: ['ollama'],
    });

    const response = await manager.chat(
      {
        modelId: 'llama3.2',
        messages: [{ role: 'user', content: 'hello' }],
      },
      'dev-user',
      'plan',
    );

    expect(response.providerId).toBe('ollama');
  });
});
