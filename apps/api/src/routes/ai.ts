import { AppError, ERROR_CODES, FEATURE_FLAGS, isFeatureEnabled, type AiChatRequest } from '@urms/shared';
import type { FastifyInstance } from 'fastify';

import type { AppServices } from '../types/services.js';
import { aiChatRateLimitConfig } from '../plugins/security.js';

export async function registerAiRoutes(app: FastifyInstance, services: AppServices): Promise<void> {
  const { aiManager } = services;

  app.get('/v1/ai/providers', async () => {
    assertAiEnabled();
    return { data: aiManager.listProviders() };
  });

  app.get('/v1/ai/providers/:providerId/health', async (request) => {
    assertAiEnabled();
    const params = request.params as { providerId: string };
    const health = await aiManager.healthCheck(params.providerId);
    return { data: health };
  });

  app.post('/v1/ai/chat', { config: aiChatRateLimitConfig() }, async (request, reply) => {
    assertAiEnabled();

    const body = request.body as {
      modelId?: string;
      messages?: AiChatRequest['messages'];
      providerId?: string;
    };

    const response = await aiManager.chat(
      {
        modelId: body.modelId ?? 'llama3.2',
        messages: body.messages ?? [],
        providerId: body.providerId,
      },
      request.actorId,
      request.urmsMode,
    );

    return reply.status(200).send({ data: response });
  });
}

function assertAiEnabled(): void {
  if (!isFeatureEnabled(FEATURE_FLAGS.AI_ENABLED)) {
    throw new AppError(
      ERROR_CODES.FEATURE_DISABLED,
      'AI features are disabled (ff.ai.enabled)',
    );
  }
}
