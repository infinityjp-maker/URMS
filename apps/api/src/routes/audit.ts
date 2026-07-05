import { URMS_CORE_MODES, isFeatureEnabled } from '@urms/shared';
import { assertModeAllowed, modePolicy } from '@urms/domain';
import type { FastifyInstance } from 'fastify';

import type { AppServices } from '../types/services.js';

export async function registerAuditRoutes(app: FastifyInstance, services: AppServices): Promise<void> {
  app.get('/v1/audit/logs', async (request) => {
    assertModeAllowed(modePolicy.canViewAudit(request.urmsMode), 'Audit logs require audit mode');

    const query = request.query as Record<string, string | undefined>;
    const page = parsePositiveInt(query.page, 1);
    const limit = Math.min(parsePositiveInt(query.limit, 20), 100);

    const result = await services.auditLogRepository.list({
      resourceType: query.resourceType,
      actorId: query.actor,
      from: query.from,
      to: query.to,
      page,
      limit,
    });

    return {
      data: result.items,
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
      },
    };
  });
}

export async function registerModeRoutes(app: FastifyInstance): Promise<void> {
  app.get('/v1/modes', async () => {
    const modes = [...URMS_CORE_MODES];
    if (isFeatureEnabled('ff.develop.enabled')) {
      modes.push('develop');
    }
    return {
      data: modes.map((mode) => ({ id: mode })),
    };
  });

  app.get('/v1/modes/current', async (request) => ({
    data: { mode: request.urmsMode },
  }));
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
