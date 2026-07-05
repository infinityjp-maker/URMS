import type { ResourceEntity, ResourceStatus } from '@urms/shared';
import type { Resource as PrismaResource, ResourceStatus as PrismaResourceStatus } from '@prisma/client';

const STATUS_MAP: Record<PrismaResourceStatus, ResourceStatus> = {
  draft: 'draft',
  active: 'active',
  deprecated: 'deprecated',
  archived: 'archived',
};

export function toResourceEntity(row: PrismaResource): ResourceEntity {
  return {
    resourceType: row.resourceType,
    resourceId: row.resourceId,
    name: row.name,
    status: STATUS_MAP[row.status],
    metadata: asMetadata(row.metadata),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toPrismaStatus(status: ResourceStatus): PrismaResourceStatus {
  return status;
}

function asMetadata(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}
