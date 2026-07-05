import { createFastifyLoggerOptions } from '@urms/logger';
import Fastify from 'fastify';
import { registerAuthPlugin } from './plugins/auth.js';
import { registerErrorHandler } from './plugins/error-handler.js';
import { registerModePlugin } from './plugins/mode.js';
import { createRequestMetrics, registerMetricsPlugin } from './plugins/request-metrics.js';
import { registerAiRoutes } from './routes/ai.js';
import { registerAuditRoutes, registerModeRoutes } from './routes/audit.js';
import { registerContextRoutes } from './routes/context.js';
import { registerPluginRoutes } from './routes/plugins.js';
import { registerAuthRoutes } from './routes/auth.js';
import { registerHealthRoutes } from './routes/health.js';
import { registerMetricsRoutes } from './routes/metrics.js';
import { registerResourceRoutes } from './routes/resources.js';
import type { AppServices } from './types/services.js';

import { createAppServices } from './lib/wire-services.js';

export interface CreateAppOptions {
  databaseUrl?: string;
  services?: AppServices;
  logger?: boolean;
}

export async function createApp(options: CreateAppOptions = {}) {
  const services = options.services ?? createAppServices(options.databaseUrl);
  const metrics = createRequestMetrics();
  const app = Fastify({
    logger: options.logger === false ? false : createFastifyLoggerOptions('urms-api'),
  });

  registerErrorHandler(app);
  await registerMetricsPlugin(app, metrics);
  await registerAuthPlugin(app);
  await registerModePlugin(app);

  await registerHealthRoutes(app, services);
  await registerMetricsRoutes(app, metrics);
  await registerAuthRoutes(app, services.localAuthService);
  await registerResourceRoutes(app, services);
  await registerContextRoutes(app, services);
  await registerAiRoutes(app, services);
  await registerPluginRoutes(app, services);
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
