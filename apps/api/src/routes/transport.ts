import { assertModeAllowed, modePolicy } from '@urms/domain';
import type { FastifyInstance } from 'fastify';

import type { AppServices } from '../types/services.js';

export async function registerTransportRoutes(app: FastifyInstance, services: AppServices): Promise<void> {
  app.get('/v1/transport/departure', async (request) => {
    assertModeAllowed(modePolicy.canReadResource(request.urmsMode), 'Transport read requires read-capable mode');

    const data = await services.transportService.getDepartureAdvice(request.urmsMode);
    return { data };
  });
}
