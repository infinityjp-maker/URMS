import {
  AuditHandler,
  InProcessEventBus,
  registerAuditHandlers,
  ResourceService,
} from '@urms/domain';
import {
  createPrismaClient,
  PrismaAuditLogRepository,
  PrismaResourceRepository,
} from '@urms/db';

import type { AppServices } from '../types/services.js';

export function createAppServices(databaseUrl?: string): AppServices {
  const prisma = createPrismaClient(databaseUrl);
  const eventBus = new InProcessEventBus();
  const resourceRepository = new PrismaResourceRepository(prisma);
  const auditLogRepository = new PrismaAuditLogRepository(prisma);
  const auditHandler = new AuditHandler(auditLogRepository);

  registerAuditHandlers(eventBus, auditHandler);

  const resourceService = new ResourceService(resourceRepository, eventBus);

  return {
    resourceService,
    auditLogRepository,
  };
}
