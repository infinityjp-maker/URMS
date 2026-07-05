import type { ResourceService, AuditLogRepository, ContextService } from '@urms/domain';

export interface AppServices {
  resourceService: ResourceService;
  contextService: ContextService;
  auditLogRepository: AuditLogRepository;
}
