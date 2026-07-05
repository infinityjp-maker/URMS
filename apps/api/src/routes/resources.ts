import { AppError, ERROR_CODES, RESOURCE_STATUSES, type ResourceStatus } from '@urms/shared';
import type { FastifyInstance } from 'fastify';

import type { AppServices } from '../types/services.js';

export async function registerResourceRoutes(app: FastifyInstance, services: AppServices): Promise<void> {
  const { resourceService } = services;

  app.get('/v1/resources', async (request) => {
    const query = request.query as Record<string, string | undefined>;
    const status = parseStatus(query.status);
    const page = parsePositiveInt(query.page, 1);
    const limit = Math.min(parsePositiveInt(query.limit, 20), 100);

    const result = await resourceService.list(
      {
        resourceType: query.type,
        status,
        q: query.q,
        page,
        limit,
      },
      request.urmsMode,
    );

    return {
      data: result.items,
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
      },
    };
  });

  app.post('/v1/resources', async (request, reply) => {
    const body = request.body as {
      resourceType?: string;
      resourceId?: string;
      name?: string;
      metadata?: Record<string, unknown>;
    };

    const created = await resourceService.create(
      {
        resourceType: body.resourceType ?? '',
        resourceId: body.resourceId ?? '',
        name: body.name ?? '',
        metadata: body.metadata,
      },
      request.actorId,
      request.urmsMode,
    );

    return reply.status(201).send({ data: created });
  });

  app.get('/v1/resources/:type/:id', async (request) => {
    const params = request.params as { type: string; id: string };
    const resource = await resourceService.getByRef(params.type, params.id, request.urmsMode);
    return { data: resource };
  });

  app.patch('/v1/resources/:type/:id', async (request) => {
    const params = request.params as { type: string; id: string };
    const body = request.body as {
      name?: string;
      metadata?: Record<string, unknown>;
    };

    const updated = await resourceService.update(
      params.type,
      params.id,
      body,
      request.actorId,
      request.urmsMode,
    );

    return { data: updated };
  });

  app.delete('/v1/resources/:type/:id', async (request) => {
    const params = request.params as { type: string; id: string };
    const archived = await resourceService.changeLifecycle(
      params.type,
      params.id,
      'archived',
      request.actorId,
      request.urmsMode,
    );

    return { data: archived };
  });

  app.patch('/v1/resources/:type/:id/lifecycle', async (request) => {
    const params = request.params as { type: string; id: string };
    const body = request.body as { status?: string };
    const status = parseStatus(body.status, true)!;

    const updated = await resourceService.changeLifecycle(
      params.type,
      params.id,
      status,
      request.actorId,
      request.urmsMode,
    );

    return { data: updated };
  });
}

function parseStatus(value: string | undefined, required = false): ResourceStatus | undefined {
  if (!value) {
    if (required) {
      throw new AppError(ERROR_CODES.VALIDATION_REQUIRED_FIELD, 'status is required');
    }
    return undefined;
  }

  if (!(RESOURCE_STATUSES as readonly string[]).includes(value)) {
    throw new AppError(ERROR_CODES.VALIDATION_REQUIRED_FIELD, `Invalid status: ${value}`);
  }

  return value as ResourceStatus;
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
