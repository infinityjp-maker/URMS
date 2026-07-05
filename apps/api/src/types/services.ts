import type { ResourceService, AuditLogRepository, ContextService, AiManager, PluginRegistry, LocalAuthService } from '@urms/domain';

export interface AppServices {
  resourceService: ResourceService;
  contextService: ContextService;
  aiManager: AiManager;
  pluginRegistry: PluginRegistry;
  auditLogRepository: AuditLogRepository;
  localAuthService: LocalAuthService;
}
