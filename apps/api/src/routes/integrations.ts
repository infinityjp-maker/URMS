import { assertModeAllowed, modePolicy } from '@urms/domain';
import type { FastifyInstance } from 'fastify';

import type { AppServices } from '../types/services.js';

export async function registerIntegrationRoutes(app: FastifyInstance, services: AppServices): Promise<void> {
  app.get('/v1/integrations', async () => ({
    data: services.integrationRegistry.list(),
  }));

  app.get('/v1/integrations/:id/health', async (request) => {
    const params = request.params as { id: string };
    const health = await services.integrationRegistry.healthCheck(params.id);
    return { data: health };
  });

  app.post('/v1/integrations/:id/sync', async (request) => {
    assertModeAllowed(
      modePolicy.canSyncIntegrations(request.urmsMode),
      'Integration sync requires develop mode',
    );

    const params = request.params as { id: string };
    const result = await services.integrationRegistry.sync(params.id, request.actorId);
    return { data: result };
  });
}
