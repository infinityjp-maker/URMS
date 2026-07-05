import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

export interface RequestMetrics {
  httpRequestsTotal: number;
  httpErrorsTotal: number;
}

export function createRequestMetrics(): RequestMetrics {
  return {
    httpRequestsTotal: 0,
    httpErrorsTotal: 0,
  };
}

export async function registerMetricsPlugin(
  app: FastifyInstance,
  metrics: RequestMetrics,
): Promise<void> {
  app.decorate('metrics', metrics);

  app.addHook('onResponse', async (request: FastifyRequest, reply: FastifyReply) => {
    metrics.httpRequestsTotal += 1;
    if (reply.statusCode >= 500) {
      metrics.httpErrorsTotal += 1;
    }

    if (request.url.startsWith('/health') || request.url.startsWith('/metrics')) {
      return;
    }

    request.log.info(
      {
        reqId: request.id,
        method: request.method,
        url: request.url,
        mode: request.urmsMode,
        userId: request.actorId,
        statusCode: reply.statusCode,
        responseTime: reply.elapsedTime,
      },
      'request completed',
    );
  });
}

declare module 'fastify' {
  interface FastifyInstance {
    metrics: RequestMetrics;
  }
}
