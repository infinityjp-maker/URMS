import type { FastifyInstance } from 'fastify';

export async function registerHealthRoutes(app: FastifyInstance): Promise<void> {
  app.get('/health', async () => ({
    data: {
      status: 'ok',
      version: '0.2.0',
    },
  }));
}
