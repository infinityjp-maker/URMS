import { assertModeAllowed, modePolicy } from '@urms/domain';
import type { FastifyInstance } from 'fastify';

import type { AppServices } from '../types/services.js';

export async function registerLoopRoutes(app: FastifyInstance, services: AppServices): Promise<void> {
  app.post('/v1/loop/sync', async (request) => {
    assertModeAllowed(
      modePolicy.canSyncIntegrations(request.urmsMode) || modePolicy.canWriteResource(request.urmsMode),
      'Loop sync requires develop or operate mode',
    );

    const report = await services.loopSyncService.sync(request.actorId, request.urmsMode);
    return { data: report };
  });

  app.post('/v1/loop/export', async (request) => {
    assertModeAllowed(
      modePolicy.canSyncIntegrations(request.urmsMode) || modePolicy.canWriteResource(request.urmsMode),
      'Loop export requires develop or operate mode',
    );

    const report = await services.loopExportService.export(request.actorId, request.urmsMode);
    return { data: report };
  });
}
