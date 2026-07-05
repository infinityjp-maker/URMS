import { assertModeAllowed, modePolicy } from '@urms/domain';
import type { FastifyInstance } from 'fastify';

import type { AppServices } from '../types/services.js';

export async function registerScheduleRoutes(app: FastifyInstance, services: AppServices): Promise<void> {
  app.post('/v1/schedule/sync', async (request) => {
    assertModeAllowed(
      modePolicy.canSyncIntegrations(request.urmsMode) || modePolicy.canWriteResource(request.urmsMode),
      'Schedule sync requires develop or operate mode',
    );

    const report = await services.scheduleSyncService.sync(request.actorId, request.urmsMode);
    return { data: report };
  });
}
