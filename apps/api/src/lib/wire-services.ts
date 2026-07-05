import {
  AiManager,
  AiProviderRegistry,
  AuditHandler,
  ContextService,
  InProcessEventBus,
  registerAuditHandlers,
  ResourceService,
} from '@urms/domain';
import {
  createPrismaClient,
  PrismaAiUsageRepository,
  PrismaAuditLogRepository,
  PrismaContextRepository,
  PrismaResourceRepository,
} from '@urms/db';
import { OllamaAdapter } from '@urms/plugin-ollama';

import type { AppServices } from '../types/services.js';

export function createAppServices(databaseUrl?: string): AppServices {
  const prisma = createPrismaClient(databaseUrl);
  const eventBus = new InProcessEventBus();
  const resourceRepository = new PrismaResourceRepository(prisma);
  const contextRepository = new PrismaContextRepository(prisma);
  const auditLogRepository = new PrismaAuditLogRepository(prisma);
  const aiUsageRepository = new PrismaAiUsageRepository(prisma);
  const auditHandler = new AuditHandler(auditLogRepository);

  registerAuditHandlers(eventBus, auditHandler);

  const resourceService = new ResourceService(resourceRepository, eventBus);
  const contextService = new ContextService(contextRepository, eventBus);

  const aiRegistry = new AiProviderRegistry();
  aiRegistry.register(
    new OllamaAdapter({
      baseUrl: process.env.OLLAMA_BASE_URL,
    }),
  );
  const aiManager = new AiManager(aiRegistry, aiUsageRepository, {
    defaultProviderId: 'ollama',
    fallbackProviderIds: ['ollama'],
  });

  return {
    resourceService,
    contextService,
    aiManager,
    auditLogRepository,
  };
}
