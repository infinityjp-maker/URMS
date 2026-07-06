import type { ContextUpdateItem } from '@urms/shared';
import type { FastifyInstance } from 'fastify';

import type { AppServices } from '../types/services.js';

export async function registerContextRoutes(app: FastifyInstance, services: AppServices): Promise<void> {
  const { contextService, loopJournalService } = services;

  app.get('/v1/context', async (request) => {
    const dashboard = await contextService.getDashboard(request.urmsMode);
    return { data: dashboard };
  });

  app.put('/v1/context', async (request) => {
    const body = request.body as { items?: ContextUpdateItem[] };
    const items = body.items ?? [];

    const dashboard = await contextService.update(items, request.actorId, request.urmsMode);
    return { data: dashboard };
  });

  app.post('/v1/context/advance-task', async (request) => {
    const before = await contextService.getDashboard(request.urmsMode);
    const dashboard = await contextService.advanceTask(request.actorId, request.urmsMode);
    await services.loopJournalService.recordAdvance(before, dashboard, request.actorId);
    return { data: dashboard };
  });
}
