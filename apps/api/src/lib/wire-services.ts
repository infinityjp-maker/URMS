import {
  AiManager,
  AiProviderRegistry,
  AuditHandler,
  ContextService,
  InProcessEventBus,
  LocalAuthService,
  PluginRegistry,
  registerAuditHandlers,
  ResourceService,
  RelationService,
  createWeatherService,
  createScheduleService,
  createAiTeamSyncService,
  resolveAiTeamRepoRoot,
} from '@urms/domain';
import {
  createPrismaClient,
  checkDatabaseHealth,
  PrismaAiUsageRepository,
  PrismaAuditLogRepository,
  PrismaContextRepository,
  PrismaRelationRepository,
  PrismaResourceRepository,
  PrismaUserRepository,
} from '@urms/db';
import { OllamaAdapter } from '@urms/plugin-ollama';
import { createBuiltinResourceTypePlugins } from '@urms/plugin-resource-types';

import type { AppServices } from '../types/services.js';

const APP_CORE_VERSION = '0.2.0';

export function createAppServices(databaseUrl?: string): AppServices {
  const prisma = createPrismaClient(databaseUrl);
  const eventBus = new InProcessEventBus();
  const resourceRepository = new PrismaResourceRepository(prisma);
  const relationRepository = new PrismaRelationRepository(prisma);
  const contextRepository = new PrismaContextRepository(prisma);
  const auditLogRepository = new PrismaAuditLogRepository(prisma);
  const aiUsageRepository = new PrismaAiUsageRepository(prisma);
  const auditHandler = new AuditHandler(auditLogRepository);

  registerAuditHandlers(eventBus, auditHandler);

  const pluginRegistry = new PluginRegistry(APP_CORE_VERSION);
  for (const plugin of createBuiltinResourceTypePlugins()) {
    pluginRegistry.register(plugin);
  }

  const resourceService = new ResourceService(resourceRepository, eventBus, pluginRegistry);
  const relationService = new RelationService(relationRepository, resourceRepository, eventBus);
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

  const userRepository = new PrismaUserRepository(prisma);
  const jwtSecret = process.env.JWT_SECRET?.trim() || 'dev-local-jwt-secret-change-me';
  const localAuthService = new LocalAuthService(userRepository, { jwtSecret });
  const weatherService = createWeatherService();
  const scheduleService = createScheduleService({ resourceService });
  const aiTeamSyncService = createAiTeamSyncService({
    repoRoot: resolveAiTeamRepoRoot(),
    resourceRepository,
    relationService,
  });

  return {
    resourceService,
    relationService,
    contextService,
    aiManager,
    pluginRegistry,
    auditLogRepository,
    localAuthService,
    weatherService,
    scheduleService,
    aiTeamSyncService,
    checkReadiness: async () => ({
      database: await checkDatabaseHealth(prisma),
    }),
  };
}
