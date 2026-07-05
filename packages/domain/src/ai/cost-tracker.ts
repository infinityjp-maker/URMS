import type { AiChatRequest, AiChatResponse, AiUsageRecord } from '@urms/shared';

import type { AiUsageRepository } from './ai-usage-repository.js';

export class AiCostTracker {
  constructor(private readonly repository: AiUsageRepository) {}

  async record(
    response: AiChatResponse,
    meta: { actorId: string; mode: string },
  ): Promise<AiUsageRecord> {
    return this.repository.append({
      providerId: response.providerId,
      modelId: response.modelId,
      promptTokens: response.usage.promptTokens,
      completionTokens: response.usage.completionTokens,
      latencyMs: response.latencyMs,
      actorId: meta.actorId,
      mode: meta.mode,
    });
  }
}

export type { AiChatRequest, AiChatResponse };
