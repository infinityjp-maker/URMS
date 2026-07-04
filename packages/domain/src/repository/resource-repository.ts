import type { ResourceEntity, ResourceStatus } from '@urms/shared';

export interface ResourceListFilter {
  resourceType?: string;
  status?: ResourceStatus;
  q?: string;
  page?: number;
  limit?: number;
}

export interface ResourceListResult {
  items: ResourceEntity[];
  total: number;
  page: number;
  limit: number;
}

export interface ResourceRepository {
  findByRef(resourceType: string, resourceId: string): Promise<ResourceEntity | null>;
  list(filter: ResourceListFilter): Promise<ResourceListResult>;
  save(entity: ResourceEntity): Promise<ResourceEntity>;
  exists(resourceType: string, resourceId: string): Promise<boolean>;
}
