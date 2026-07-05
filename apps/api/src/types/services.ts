import type { ResourceService, AuditLogRepository, ContextService, AiManager, PluginRegistry, LocalAuthService } from '@urms/domain';

export type ReadinessCheckResult = {
  database: 'ok' | 'unavailable';
};

export interface AppServices {
  resourceService: ResourceService;
  contextService: ContextService;
  aiManager: AiManager;
  pluginRegistry: PluginRegistry;
  auditLogRepository: AuditLogRepository;
  localAuthService: LocalAuthService;
  checkReadiness: () => Promise<ReadinessCheckResult>;
}
