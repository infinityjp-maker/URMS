import type { FastifyInstance } from 'fastify';

import type { LocalAuthService } from '@urms/domain';

interface LoginBody {
  username?: string;
  password?: string;
}

export async function registerAuthRoutes(
  app: FastifyInstance,
  localAuthService: LocalAuthService,
): Promise<void> {
  app.post<{ Body: LoginBody }>('/v1/auth/login', async (request, reply) => {
    const username = request.body?.username ?? '';
    const password = request.body?.password ?? '';
    const result = await localAuthService.login(username, password);
    return reply.send(result);
  });
}
