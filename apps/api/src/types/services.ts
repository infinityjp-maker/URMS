import type { ResourceService, AuditLogRepository } from '@urms/domain';

export interface AppServices {
  resourceService: ResourceService;
  auditLogRepository: AuditLogRepository;
}
