import type { ResourceService, AuditLogRepository, ContextService, AiManager } from '@urms/domain';

export interface AppServices {
  resourceService: ResourceService;
  contextService: ContextService;
  aiManager: AiManager;
  auditLogRepository: AuditLogRepository;
}
