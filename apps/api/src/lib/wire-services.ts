import {
  AuditHandler,
  ContextService,
  InProcessEventBus,
  registerAuditHandlers,
  ResourceService,
} from '@urms/domain';
import {
  createPrismaClient,
  PrismaAuditLogRepository,
  PrismaContextRepository,
  PrismaResourceRepository,
} from '@urms/db';

import type { AppServices } from '../types/services.js';

export function createAppServices(databaseUrl?: string): AppServices {
  const prisma = createPrismaClient(databaseUrl);
  const eventBus = new InProcessEventBus();
  const resourceRepository = new PrismaResourceRepository(prisma);
  const contextRepository = new PrismaContextRepository(prisma);
  const auditLogRepository = new PrismaAuditLogRepository(prisma);
  const auditHandler = new AuditHandler(auditLogRepository);

  registerAuditHandlers(eventBus, auditHandler);

  const resourceService = new ResourceService(resourceRepository, eventBus);
  const contextService = new ContextService(contextRepository, eventBus);

  return {
    resourceService,
    contextService,
    auditLogRepository,
  };
}
