import { AppError, ERROR_CODES } from '@urms/shared';
import type { FastifyInstance, FastifyReply } from 'fastify';

export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error, request, reply: FastifyReply) => {
    if (error instanceof AppError) {
      return reply.status(error.httpStatus).send({
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      });
    }

    request.log.error(error);
    return reply.status(500).send({
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Internal server error',
        details: [],
      },
    });
  });
}
