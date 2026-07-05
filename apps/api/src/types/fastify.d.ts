import type { UrmsMode } from '@urms/shared';

declare module 'fastify' {
  interface FastifyRequest {
    actorId: string;
    urmsMode: UrmsMode;
  }
}

export {};
