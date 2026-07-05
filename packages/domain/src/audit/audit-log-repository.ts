export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LIFECYCLE';

export interface AuditLogCreateInput {
  action: AuditAction;
  resourceType?: string;
  resourceId?: string;
  actorId: string;
  mode: string;
  payload?: Record<string, unknown>;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  actorId: string;
  mode: string;
  payload?: Record<string, unknown>;
  createdAt: string;
}

export interface AuditLogListFilter {
  resourceType?: string;
  actorId?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export interface AuditLogListResult {
  items: AuditLogEntry[];
  total: number;
  page: number;
  limit: number;
}

export interface AuditLogRepository {
  append(input: AuditLogCreateInput): Promise<void>;
  list(filter: AuditLogListFilter): Promise<AuditLogListResult>;
}
