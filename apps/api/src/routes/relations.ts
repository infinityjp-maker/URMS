import type { FastifyInstance } from 'fastify';

import type { AppServices } from '../types/services.js';

export async function registerRelationRoutes(app: FastifyInstance, services: AppServices): Promise<void> {
  const { relationService } = services;

  app.get('/v1/relations', async (request) => {
    const query = request.query as Record<string, string | undefined>;
    const items = await relationService.list(
      {
        fromType: query.fromType,
        fromId: query.fromId,
        toType: query.toType,
        toId: query.toId,
        relationType: query.relationType,
        resourceType: query.resourceType,
        resourceId: query.resourceId,
        limit: parseLimit(query.limit),
      },
      request.urmsMode,
    );

    return { data: items };
  });

  app.post('/v1/relations', async (request, reply) => {
    const body = request.body as {
      fromType?: string;
      fromId?: string;
      toType?: string;
      toId?: string;
      relationType?: string;
    };

    const created = await relationService.create(
      {
        fromType: body.fromType ?? '',
        fromId: body.fromId ?? '',
        toType: body.toType ?? '',
        toId: body.toId ?? '',
        relationType: body.relationType ?? '',
      },
      request.actorId,
      request.urmsMode,
    );

    return reply.status(201).send({ data: created });
  });

  app.delete('/v1/relations/:id', async (request, reply) => {
    const params = request.params as { id: string };
    await relationService.delete(params.id, request.actorId, request.urmsMode);
    return reply.status(204).send();
  });

  app.get('/v1/resources/:type/:id/relations', async (request) => {
    const params = request.params as { type: string; id: string };
    const items = await relationService.listForResource(params.type, params.id, request.urmsMode);
    return { data: items };
  });
}

function parseLimit(value: string | undefined): number {
  if (!value) return 50;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 100) : 50;
}
