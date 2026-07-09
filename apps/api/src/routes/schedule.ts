import { assertModeAllowed, modePolicy } from '@urms/domain';
import type { FastifyInstance } from 'fastify';

import type { AppServices } from '../types/services.js';

function parseMonthQuery(value: unknown): number | null {
  if (typeof value !== 'string') {
    return null;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function currentYearMonth(now: Date): { year: number; month: number } {
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  };
}

export async function registerScheduleRoutes(app: FastifyInstance, services: AppServices): Promise<void> {
  app.get('/v1/schedule/month', async (request, reply) => {
    assertModeAllowed(modePolicy.canReadResource(request.urmsMode), 'Schedule read requires read-capable mode');

    const now = new Date();
    const query = request.query as { year?: unknown; month?: unknown };
    const fallback = currentYearMonth(now);
    const year = parseMonthQuery(query.year) ?? fallback.year;
    const month = parseMonthQuery(query.month) ?? fallback.month;

    if (month < 1 || month > 12) {
      return reply.code(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'month must be between 1 and 12',
        },
      });
    }

    const data = await services.scheduleService.getMonthEvents(request.urmsMode, year, month, now);
    return { data };
  });

  app.get('/v1/schedule/google/status', async (request) => {
    assertModeAllowed(modePolicy.canReadResource(request.urmsMode), 'Schedule read requires read-capable mode');

    const data = await services.googleCalendarService.getStatus();
    return { data };
  });

  app.post('/v1/schedule/sync', async (request) => {
    assertModeAllowed(
      modePolicy.canSyncIntegrations(request.urmsMode) || modePolicy.canWriteResource(request.urmsMode),
      'Schedule sync requires develop or operate mode',
    );

    const report = await services.scheduleSyncService.sync(request.actorId, request.urmsMode);
    return { data: report };
  });
}
