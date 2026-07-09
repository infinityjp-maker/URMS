import { assertModeAllowed, modePolicy } from '@urms/domain';
import { ERROR_CODES } from '@urms/shared';
import type { FastifyInstance } from 'fastify';

import type { AppServices } from '../types/services.js';

export async function registerKnowledgeRoutes(app: FastifyInstance, services: AppServices): Promise<void> {
  app.get('/v1/knowledge/documents', async (request) => {
    assertModeAllowed(modePolicy.canReadResource(request.urmsMode), 'Knowledge read requires read-capable mode');

    const data = await services.knowledgeService.listDocuments();
    return { data };
  });

  app.get('/v1/knowledge/documents/:id', async (request, reply) => {
    assertModeAllowed(modePolicy.canReadResource(request.urmsMode), 'Knowledge read requires read-capable mode');

    const params = request.params as { id: string };
    const data = await services.knowledgeService.getDocument(params.id);
    if (!data) {
      return reply.code(404).send({
        error: {
          code: ERROR_CODES.RESOURCE_NOT_FOUND,
          message: `Document not found: ${params.id}`,
        },
      });
    }

    return { data };
  });
}
