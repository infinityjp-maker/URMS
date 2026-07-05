import cors from '@fastify/cors';
import { createFastifyLoggerOptions } from '@urms/logger';
import Fastify from 'fastify';
import { registerAuthPlugin } from './plugins/auth.js';
import { registerErrorHandler } from './plugins/error-handler.js';
import { registerModePlugin } from './plugins/mode.js';
import { registerSecurityPlugin } from './plugins/security.js';
import { createRequestMetrics, registerMetricsPlugin } from './plugins/request-metrics.js';
import { registerAiRoutes } from './routes/ai.js';
import { registerAiTeamRoutes } from './routes/ai-team.js';
import { registerAuditRoutes, registerModeRoutes } from './routes/audit.js';
import { registerContextRoutes } from './routes/context.js';
import { registerPerceptionRoutes } from './routes/perception.js';
import { registerPluginRoutes } from './routes/plugins.js';
import { registerAuthRoutes } from './routes/auth.js';
import { registerHealthRoutes } from './routes/health.js';
import { registerMetricsRoutes } from './routes/metrics.js';
import { registerResourceRoutes } from './routes/resources.js';
import { registerRelationRoutes } from './routes/relations.js';
import type { AppServices } from './types/services.js';

import { createAppServices } from './lib/wire-services.js';

export interface CreateAppOptions {
  databaseUrl?: string;
  services?: AppServices;
  logger?: boolean;
  /** Default: enabled except when NODE_ENV=test */
  security?: boolean;
}

export async function createApp(options: CreateAppOptions = {}) {
  const services = options.services ?? createAppServices(options.databaseUrl);
  const metrics = createRequestMetrics();
  const securityEnabled = options.security ?? process.env.NODE_ENV !== 'test';
  const app = Fastify({
    logger: options.logger === false ? false : createFastifyLoggerOptions('urms-api'),
  });

  await app.register(cors, {
    origin: (origin, callback) => {
      if (
        !origin ||
        /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin) ||
        origin.startsWith('tauri://')
      ) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
  });

  await registerSecurityPlugin(app, { enabled: securityEnabled });

  registerErrorHandler(app);
  await registerMetricsPlugin(app, metrics);
  await registerAuthPlugin(app);
  await registerModePlugin(app);

  await registerHealthRoutes(app, services);
  await registerMetricsRoutes(app, metrics);
  await registerAuthRoutes(app, services.localAuthService);
  await registerResourceRoutes(app, services);
  await registerRelationRoutes(app, services);
  await registerContextRoutes(app, services);
  await registerPerceptionRoutes(app, services);
  await registerAiRoutes(app, services);
  await registerAiTeamRoutes(app, services);
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
