import { AppError, ERROR_CODES, isFeatureEnabled, isUrmsMode } from '@urms/shared';
import type { FastifyInstance, FastifyRequest } from 'fastify';

export async function registerModePlugin(app: FastifyInstance): Promise<void> {
  app.addHook('onRequest', async (request: FastifyRequest) => {
    if (request.url.startsWith('/health') || request.url.startsWith('/metrics')) {
      request.urmsMode = 'operate';
      return;
    }

    const header = request.headers['x-urms-mode'];
    const rawMode = Array.isArray(header) ? header[0] : header;

    if (!rawMode) {
      request.urmsMode = 'operate';
      return;
    }

    if (rawMode === 'develop' && !isFeatureEnabled('ff.develop.enabled')) {
      throw new AppError(ERROR_CODES.FEATURE_DISABLED, 'develop mode is disabled');
    }

    if (!isUrmsMode(rawMode)) {
      throw new AppError(ERROR_CODES.MODE_NOT_ALLOWED, `Invalid mode: ${rawMode}`);
    }

    request.urmsMode = rawMode;
  });
}
