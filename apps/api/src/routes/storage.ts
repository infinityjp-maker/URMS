import { assertModeAllowed, modePolicy } from '@urms/domain';
import { ERROR_CODES } from '@urms/shared';
import type { FastifyInstance } from 'fastify';

import type { AppServices } from '../types/services.js';

export async function registerStorageRoutes(app: FastifyInstance, services: AppServices): Promise<void> {
  app.get('/v1/storage/overview', async (request) => {
    assertModeAllowed(modePolicy.canReadResource(request.urmsMode), 'Storage read requires read-capable mode');

    const data = await services.storageService.getOverview(request.urmsMode);
    return { data };
  });

  app.get('/v1/storage/tips', async (request) => {
    assertModeAllowed(modePolicy.canReadResource(request.urmsMode), 'Storage read requires read-capable mode');

    const data = { tips: services.storageService.listCleanupTips() };
    return { data };
  });

  app.get('/v1/storage/volumes/:id', async (request, reply) => {
    assertModeAllowed(modePolicy.canReadResource(request.urmsMode), 'Storage read requires read-capable mode');

    const params = request.params as { id: string };
    const data = await services.storageService.getVolume(params.id, request.urmsMode);
    if (!data) {
      return reply.code(404).send({
        error: {
          code: ERROR_CODES.RESOURCE_NOT_FOUND,
          message: `Storage volume not found: ${params.id}`,
        },
      });
    }

    return { data };
  });
}
