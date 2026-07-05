import type { FastifyInstance } from 'fastify';

import type { RequestMetrics } from '../plugins/request-metrics.js';

function formatPrometheusCounter(name: string, help: string, value: number): string {
  return `# HELP ${name} ${help}\n# TYPE ${name} counter\n${name} ${value}\n`;
}

export async function registerMetricsRoutes(
  app: FastifyInstance,
  metrics: RequestMetrics,
): Promise<void> {
  app.get('/metrics', async (_request, reply) => {
    const body = [
      formatPrometheusCounter(
        'urms_http_requests_total',
        'Total HTTP requests handled by the API',
        metrics.httpRequestsTotal,
      ),
      formatPrometheusCounter(
        'urms_http_errors_total',
        'Total HTTP 5xx responses',
        metrics.httpErrorsTotal,
      ),
    ].join('\n');

    return reply.type('text/plain; version=0.0.4; charset=utf-8').send(body);
  });
}
