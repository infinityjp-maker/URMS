import type { FastifyInstance } from 'fastify';
import { buildPerceptionState } from '@urms/domain';

import type { AppServices } from '../types/services.js';

export async function registerPerceptionRoutes(
  app: FastifyInstance,
  services: AppServices,
): Promise<void> {
  app.get('/v1/perception', async (request) => {
    const now = new Date();
    const dashboard = await services.contextService.getDashboard(request.urmsMode);
    const [weather, nextEvents] = await Promise.all([
      services.weatherService.getCurrentWeather(),
      services.scheduleService.getTodayEvents(request.urmsMode, now),
    ]);
    const state = buildPerceptionState(dashboard, now, { weather, nextEvents });
    return { data: state };
  });
}
