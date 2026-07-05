import type { FastifyInstance } from 'fastify';

import type { AppServices } from '../types/services.js';

export async function registerAiTeamRoutes(app: FastifyInstance, services: AppServices): Promise<void> {
  app.post('/v1/ai-team/sync', async (request) => {
    const report = await services.aiTeamSyncService.sync(request.actorId, request.urmsMode);
    return { data: report };
  });
}
