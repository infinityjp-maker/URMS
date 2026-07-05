import { AppError, ERROR_CODES } from '@urms/shared';
import type { FastifyInstance, FastifyRequest } from 'fastify';

export async function registerAuthPlugin(app: FastifyInstance): Promise<void> {
  app.addHook('onRequest', async (request: FastifyRequest) => {
    if (request.url.startsWith('/health')) {
      return;
    }

    const bypass = process.env.URMS_AUTH_BYPASS !== 'false';
    const authorization = request.headers.authorization;

    if (bypass) {
      request.actorId = authorization?.startsWith('Bearer ')
        ? authorization.slice('Bearer '.length).trim() || 'dev-user'
        : 'dev-user';
      return;
    }

    if (!authorization?.startsWith('Bearer ')) {
      throw new AppError(ERROR_CODES.AUTH_INVALID_TOKEN, 'Missing or invalid authorization header');
    }

    request.actorId = authorization.slice('Bearer '.length).trim() || 'mock-user';
  });
}
