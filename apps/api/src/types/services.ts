import type { ResourceService, AuditLogRepository, ContextService, AiManager, PluginRegistry, LocalAuthService, WeatherService, ScheduleService, RelationService, AiTeamSyncService, IntegrationRegistry } from '@urms/domain';

export type ReadinessCheckResult = {
  database: 'ok' | 'unavailable';
};

export interface AppServices {
  resourceService: ResourceService;
  relationService: RelationService;
  contextService: ContextService;
  aiManager: AiManager;
  pluginRegistry: PluginRegistry;
  auditLogRepository: AuditLogRepository;
  localAuthService: LocalAuthService;
  weatherService: WeatherService;
  scheduleService: ScheduleService;
  aiTeamSyncService: AiTeamSyncService;
  integrationRegistry: IntegrationRegistry;
  checkReadiness: () => Promise<ReadinessCheckResult>;
}
