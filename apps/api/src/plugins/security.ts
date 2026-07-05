import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance } from 'fastify';

export interface SecurityPluginOptions {
  enabled?: boolean;
}

function parseLimit(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export async function registerSecurityPlugin(
  app: FastifyInstance,
  options: SecurityPluginOptions = {},
): Promise<void> {
  if (options.enabled === false) {
    return;
  }

  await app.register(helmet, {
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  });

  const globalMax = parseLimit(process.env.URMS_RATE_LIMIT_MAX, 120);

  await app.register(rateLimit, {
    global: true,
    max: globalMax,
    timeWindow: '1 minute',
    allowList: (request) => {
      const path = request.url.split('?')[0] ?? '';
      return path.startsWith('/health') || path.startsWith('/metrics');
    },
  });
}

export function aiChatRateLimitConfig() {
  return {
    rateLimit: {
      max: parseLimit(process.env.URMS_AI_RATE_LIMIT_MAX, 20),
      timeWindow: '1 minute',
    },
  };
}
