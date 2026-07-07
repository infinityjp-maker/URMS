import type { FastifyInstance } from 'fastify';
import { URMS_APP_VERSION } from '@urms/shared';

import type { AppServices } from '../types/services.js';

export async function registerHealthRoutes(
  app: FastifyInstance,
  services?: Pick<AppServices, 'checkReadiness'>,
): Promise<void> {
  app.get('/health', async () => ({
    data: {
      status: 'ok',
      version: URMS_APP_VERSION,
    },
  }));

  app.get('/health/ready', async (_request, reply) => {
    const database = services?.checkReadiness
      ? await services.checkReadiness()
      : { database: 'unavailable' as const };

    const ready = database.database === 'ok';

    return reply.status(ready ? 200 : 503).send({
      data: {
        status: ready ? 'ready' : 'not_ready',
        version: URMS_APP_VERSION,
        checks: {
          database: database.database,
        },
      },
    });
  });
}
