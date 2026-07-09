import type { ResourceService, AuditLogRepository, ContextService, AiManager, PluginRegistry, LocalAuthService, WeatherService, ScheduleService, GoogleCalendarService, TransportService, OperationsService, KnowledgeService, AssetService, StorageService, VideoService, RelationService, AiTeamSyncService, ScheduleSyncService, LocationSyncService, LoopSyncService, LoopExportService, LoopJournalService, IntegrationRegistry } from '@urms/domain';

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
  googleCalendarService: GoogleCalendarService;
  transportService: TransportService;
  operationsService: OperationsService;
  knowledgeService: KnowledgeService;
  assetService: AssetService;
  storageService: StorageService;
  videoService: VideoService;
  aiTeamSyncService: AiTeamSyncService;
  scheduleSyncService: ScheduleSyncService;
  locationSyncService: LocationSyncService;
  loopSyncService: LoopSyncService;
  loopExportService: LoopExportService;
  loopJournalService: LoopJournalService;
  integrationRegistry: IntegrationRegistry;
  checkReadiness: () => Promise<ReadinessCheckResult>;
}
