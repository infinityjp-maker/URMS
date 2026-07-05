import { assertModeAllowed, modePolicy } from '@urms/domain';
import type { FastifyInstance } from 'fastify';

import type { AppServices } from '../types/services.js';

export async function registerLocationRoutes(app: FastifyInstance, services: AppServices): Promise<void> {
  app.post('/v1/location/sync', async (request) => {
    assertModeAllowed(
      modePolicy.canSyncIntegrations(request.urmsMode) || modePolicy.canWriteResource(request.urmsMode),
      'Location sync requires develop or operate mode',
    );

    const report = await services.locationSyncService.sync(request.actorId, request.urmsMode);
    return { data: report };
  });
}
