import { AppError, ERROR_CODES, verifyAccessToken } from '@urms/shared';
import type { FastifyInstance, FastifyRequest } from 'fastify';

import { resolveAuthConfig } from '../lib/auth-config.js';

const PUBLIC_PREFIXES = ['/health', '/metrics', '/v1/auth/login'];

function isPublicRoute(url: string): boolean {
  return PUBLIC_PREFIXES.some((prefix) => url.startsWith(prefix));
}

export async function registerAuthPlugin(app: FastifyInstance): Promise<void> {
  const authConfig = resolveAuthConfig();

  app.addHook('onRequest', async (request: FastifyRequest) => {
    const path = request.url.split('?')[0] ?? request.url;
    if (isPublicRoute(path)) {
      return;
    }

    if (authConfig.mode === 'bypass') {
      const authorization = request.headers.authorization;
      request.actorId = authorization?.startsWith('Bearer ')
        ? authorization.slice('Bearer '.length).trim() || 'dev-user'
        : 'dev-user';
      return;
    }

    if (!authConfig.jwtSecret) {
      throw new AppError(
        ERROR_CODES.INTERNAL_ERROR,
        'JWT_SECRET is required when URMS_AUTH_MODE=local',
      );
    }

    const authorization = request.headers.authorization;
    if (!authorization?.startsWith('Bearer ')) {
      throw new AppError(ERROR_CODES.AUTH_INVALID_TOKEN, 'Missing or invalid authorization header');
    }

    const token = authorization.slice('Bearer '.length).trim();
    try {
      const claims = verifyAccessToken(token, authConfig.jwtSecret);
      request.actorId = claims.sub;
    } catch {
      throw new AppError(ERROR_CODES.AUTH_INVALID_TOKEN, 'Invalid or expired access token');
    }
  });
}
