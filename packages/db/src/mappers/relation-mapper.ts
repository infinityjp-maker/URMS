import type { ResourceRelation } from '@prisma/client';
import type { ResourceRelationEntity } from '@urms/shared';

export function toResourceRelationEntity(row: ResourceRelation): ResourceRelationEntity {
  return {
    id: row.id,
    fromType: row.fromType,
    fromId: row.fromId,
    toType: row.toType,
    toId: row.toId,
    relationType: row.relationType,
    createdAt: row.createdAt.toISOString(),
    createdBy: row.createdBy ?? undefined,
  };
}
