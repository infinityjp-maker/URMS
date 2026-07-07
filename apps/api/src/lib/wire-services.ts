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
  createScheduleSyncService,
  createLocationSyncService,
  createLoopSyncService,
  createLoopExportService,
  createLoopJournalService,
  createAiTeamExportService,
  createContextSsotExportService,
  persistLoopEntryWithRelation,
  resolveLoopJournalSsotMode,
  resolveAiTeamRepoRoot,
  resolveScheduleRepoRoot,
  resolveLocationRepoRoot,
  resolveLoopJournalRepoRoot,
  IntegrationRegistry,
  CursorLocalIntegration,
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
import { URMS_CORE_VERSION } from '@urms/shared';
import { createBuiltinResourceTypePlugins } from '@urms/plugin-resource-types';

import type { AppServices } from '../types/services.js';

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

  const pluginRegistry = new PluginRegistry(URMS_CORE_VERSION);
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
  const weatherService = createWeatherService({ resourceRepository });
  const scheduleService = createScheduleService({ resourceService });
  const aiTeamRepoRoot = resolveAiTeamRepoRoot();
  const aiTeamSyncService = createAiTeamSyncService({
    repoRoot: aiTeamRepoRoot,
    resourceRepository,
    relationService,
  });
  const aiTeamExportService = createAiTeamExportService({
    repoRoot: aiTeamRepoRoot,
    resourceRepository,
  });
  const contextSsotExportService = createContextSsotExportService({
    repoRoot: aiTeamRepoRoot,
    contextRepository,
  });
  const scheduleSyncService = createScheduleSyncService({
    repoRoot: resolveScheduleRepoRoot(),
    resourceRepository,
  });
  const locationSyncService = createLocationSyncService({
    repoRoot: resolveLocationRepoRoot(),
    resourceRepository,
  });
  const loopSyncService = createLoopSyncService({
    repoRoot: resolveLoopJournalRepoRoot(),
    resourceRepository,
  });
  const loopExportService = createLoopExportService({
    repoRoot: resolveLoopJournalRepoRoot(),
    resourceRepository,
  });
  const loopJournalSsotMode = resolveLoopJournalSsotMode();
  const loopJournalService = createLoopJournalService({
    repoRoot: resolveLoopJournalRepoRoot(),
    resourceRepository,
    ssotMode: loopJournalSsotMode,
    persistLoopEntry: async (entry, actorId, mode) => {
      await persistLoopEntryWithRelation(resourceService, relationService, entry, actorId, mode);
    },
    exportJournal:
      loopJournalSsotMode === 'resource-export'
        ? async () => {
            await loopExportService.export('loop-journal-export', 'operate');
          }
        : undefined,
  });

  const integrationRegistry = new IntegrationRegistry();
  integrationRegistry.register(
    new CursorLocalIntegration({
      repoRoot: aiTeamRepoRoot,
      aiTeamSyncService,
      aiTeamExportService,
      contextSsotExportService,
    }),
  );

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
    scheduleSyncService,
    locationSyncService,
    loopSyncService,
    loopExportService,
    loopJournalService,
    integrationRegistry,
    checkReadiness: async () => ({
      database: await checkDatabaseHealth(prisma),
    }),
  };
}
