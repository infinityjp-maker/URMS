import { assertModeAllowed, modePolicy } from '@urms/domain';
import { ERROR_CODES } from '@urms/shared';
import type { FastifyInstance } from 'fastify';

import type { AppServices } from '../types/services.js';

export async function registerVideoRoutes(app: FastifyInstance, services: AppServices): Promise<void> {
  app.get('/v1/videos/library', async (request) => {
    assertModeAllowed(modePolicy.canReadResource(request.urmsMode), 'Video read requires read-capable mode');

    const data = await services.videoService.getLibrary(request.urmsMode);
    return { data };
  });

  app.get('/v1/videos/policies', async (request) => {
    assertModeAllowed(modePolicy.canReadResource(request.urmsMode), 'Video read requires read-capable mode');

    const data = { policies: services.videoService.listStoragePolicies() };
    return { data };
  });

  app.get('/v1/videos/:id', async (request, reply) => {
    assertModeAllowed(modePolicy.canReadResource(request.urmsMode), 'Video read requires read-capable mode');

    const params = request.params as { id: string };
    const data = await services.videoService.getVideo(params.id, request.urmsMode);
    if (!data) {
      return reply.code(404).send({
        error: {
          code: ERROR_CODES.RESOURCE_NOT_FOUND,
          message: `Video not found: ${params.id}`,
        },
      });
    }

    return { data };
  });
}
