import { buildPerceptionMeta, buildPerceptionState, resolveRelationGraphSignal } from '@urms/domain';
import type { FastifyInstance } from 'fastify';

import type { AppServices } from '../types/services.js';

export async function registerPerceptionRoutes(
  app: FastifyInstance,
  services: AppServices,
): Promise<void> {
  app.get('/v1/perception', async (request) => {
    const now = new Date();
    const dashboard = await services.contextService.getDashboard(request.urmsMode);
    const [weather, nextEvents, loopJournal, graph] = await Promise.all([
      services.weatherService.getCurrentWeather(),
      services.scheduleService.getTodayEvents(request.urmsMode, now),
      services.loopJournalService.readRecent(20),
      resolveRelationGraphSignal(services.relationService, request.urmsMode),
    ]);
    const state = buildPerceptionState(dashboard, now, {
      weather,
      nextEvents,
      loopJournal,
      graphRelations: graph.activeRelations,
    });
    return {
      data: state,
      meta: buildPerceptionMeta(
        dashboard,
        state,
        loopJournal,
        now,
        graph.activeRelations,
      ),
    };
  });
}
