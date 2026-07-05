import type { ResourceService, AuditLogRepository, ContextService, AiManager, PluginRegistry, LocalAuthService, WeatherService, ScheduleService, RelationService, AiTeamSyncService, ScheduleSyncService, LocationSyncService, IntegrationRegistry } from '@urms/domain';

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
  scheduleSyncService: ScheduleSyncService;
  locationSyncService: LocationSyncService;
  integrationRegistry: IntegrationRegistry;
  checkReadiness: () => Promise<ReadinessCheckResult>;
}
