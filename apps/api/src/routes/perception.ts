import type { FastifyInstance } from 'fastify';
import { buildPerceptionState } from '@urms/domain';

import type { AppServices } from '../types/services.js';

export async function registerPerceptionRoutes(
  app: FastifyInstance,
  services: AppServices,
): Promise<void> {
  app.get('/v1/perception', async (request) => {
    const dashboard = await services.contextService.getDashboard(request.urmsMode);
    const weather = await services.weatherService.getCurrentWeather();
    const state = buildPerceptionState(dashboard, new Date(), weather);
    return { data: state };
  });
}
