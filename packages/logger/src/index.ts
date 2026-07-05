import pino from 'pino';

export type Logger = pino.Logger;

const REDACT_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'password',
  'req.body.password',
];

export function createLogger(name = 'urms'): Logger {
  return pino({
    name,
    level: process.env.LOG_LEVEL ?? 'info',
    redact: REDACT_PATHS,
  });
}

/** Fastify logger options — structured JSON, ADR-012 compliant redaction. */
export function createFastifyLoggerOptions(service = 'urms-api') {
  return {
    level: process.env.LOG_LEVEL ?? 'info',
    redact: REDACT_PATHS,
    serializers: {
      req(request: { method: string; url: string; urmsMode?: string; actorId?: string }) {
        return {
          method: request.method,
          url: request.url,
          mode: request.urmsMode,
          userId: request.actorId,
        };
      },
      res(reply: { statusCode: number }) {
        return {
          statusCode: reply.statusCode,
        };
      },
    },
    base: { service },
  };
}
