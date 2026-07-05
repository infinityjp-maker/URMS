import Fastify from 'fastify';

import { createLogger } from '@urms/logger';

import { createAppServices } from './lib/wire-services.js';
import { registerAuthPlugin } from './plugins/auth.js';
import { registerErrorHandler } from './plugins/error-handler.js';
import { registerModePlugin } from './plugins/mode.js';
import { registerAuditRoutes, registerModeRoutes } from './routes/audit.js';
import { registerHealthRoutes } from './routes/health.js';
import { registerResourceRoutes } from './routes/resources.js';
import type { AppServices } from './types/services.js';

export interface CreateAppOptions {
  databaseUrl?: string;
  services?: AppServices;
  logger?: boolean;
}

export async function createApp(options: CreateAppOptions = {}) {
  const services = options.services ?? createAppServices(options.databaseUrl);
  const app = Fastify({
    logger: options.logger === false ? false : createLogger('api'),
  });

  registerErrorHandler(app);
  await registerAuthPlugin(app);
  await registerModePlugin(app);

  await registerHealthRoutes(app);
  await registerResourceRoutes(app, services);
  await registerAuditRoutes(app, services);
  await registerModeRoutes(app);

  app.decorate('services', services);

  return app;
}

declare module 'fastify' {
  interface FastifyInstance {
    services: AppServices;
  }
}
