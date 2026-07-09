import { assertModeAllowed, isOperationFlowId, modePolicy } from '@urms/domain';
import { ERROR_CODES } from '@urms/shared';
import type { FastifyInstance } from 'fastify';

import type { AppServices } from '../types/services.js';

export async function registerOperationsRoutes(app: FastifyInstance, services: AppServices): Promise<void> {
  app.get('/v1/operations/flows', async (request) => {
    assertModeAllowed(modePolicy.canReadResource(request.urmsMode), 'Operations read requires read-capable mode');

    const data = await services.operationsService.listFlows(request.urmsMode);
    return { data };
  });

  app.get('/v1/operations/flows/:id', async (request, reply) => {
    assertModeAllowed(modePolicy.canReadResource(request.urmsMode), 'Operations read requires read-capable mode');

    const params = request.params as { id: string };
    if (!isOperationFlowId(params.id)) {
      return reply.code(404).send({
        error: {
          code: ERROR_CODES.RESOURCE_NOT_FOUND,
          message: `Operation flow not found: ${params.id}`,
        },
      });
    }

    const data = await services.operationsService.getFlowDetail(params.id, request.urmsMode);
    if (!data) {
      return reply.code(404).send({
        error: {
          code: ERROR_CODES.RESOURCE_NOT_FOUND,
          message: `Operation flow not found: ${params.id}`,
        },
      });
    }

    return { data };
  });
}
