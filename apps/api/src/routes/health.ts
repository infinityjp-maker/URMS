import type { FastifyInstance } from 'fastify';

import type { AppServices } from '../types/services.js';

const APP_VERSION = '0.2.0';

export async function registerHealthRoutes(
  app: FastifyInstance,
  services?: Pick<AppServices, 'checkReadiness'>,
): Promise<void> {
  app.get('/health', async () => ({
    data: {
      status: 'ok',
      version: APP_VERSION,
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
        version: APP_VERSION,
        checks: {
          database: database.database,
        },
      },
    });
  });
}
