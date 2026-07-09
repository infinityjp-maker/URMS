import { assertModeAllowed, modePolicy } from '@urms/domain';
import { ERROR_CODES } from '@urms/shared';
import type { FastifyInstance } from 'fastify';

import type { AppServices } from '../types/services.js';

export async function registerAssetRoutes(app: FastifyInstance, services: AppServices): Promise<void> {
  app.get('/v1/assets', async (request) => {
    assertModeAllowed(modePolicy.canReadResource(request.urmsMode), 'Asset read requires read-capable mode');

    const data = await services.assetService.listAssets(request.urmsMode);
    return { data };
  });

  app.get('/v1/assets/pc-parts', async (request) => {
    assertModeAllowed(modePolicy.canReadResource(request.urmsMode), 'Asset read requires read-capable mode');

    const data = await services.assetService.listPcParts(request.urmsMode);
    return { data };
  });

  app.get('/v1/assets/:id', async (request, reply) => {
    assertModeAllowed(modePolicy.canReadResource(request.urmsMode), 'Asset read requires read-capable mode');

    const params = request.params as { id: string };
    const data = await services.assetService.getAsset(params.id, request.urmsMode);
    if (!data) {
      return reply.code(404).send({
        error: {
          code: ERROR_CODES.RESOURCE_NOT_FOUND,
          message: `Asset not found: ${params.id}`,
        },
      });
    }

    return { data };
  });
}
