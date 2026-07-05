import type { FastifyInstance } from 'fastify';

import type { AppServices } from '../types/services.js';

export async function registerPluginRoutes(app: FastifyInstance, services: AppServices): Promise<void> {
  const { pluginRegistry } = services;

  app.get('/v1/plugins/resource-types', async () => {
    return { data: pluginRegistry.list() };
  });
}
