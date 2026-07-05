import type { PrismaClient } from '@prisma/client';
import type { ResourceRelationEntity } from '@urms/shared';
import type { RelationListFilter, RelationRepository } from '@urms/domain';

import { toResourceRelationEntity } from '../mappers/relation-mapper.js';

export class PrismaRelationRepository implements RelationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<ResourceRelationEntity | null> {
    const row = await this.prisma.resourceRelation.findUnique({ where: { id } });
    return row ? toResourceRelationEntity(row) : null;
  }

  async list(filter: RelationListFilter): Promise<ResourceRelationEntity[]> {
    const where = {
      ...(filter.fromType && filter.fromId
        ? { fromType: filter.fromType, fromId: filter.fromId }
        : {}),
      ...(filter.toType && filter.toId ? { toType: filter.toType, toId: filter.toId } : {}),
      ...(filter.relationType ? { relationType: filter.relationType } : {}),
      ...(filter.resourceType && filter.resourceId
        ? {
            OR: [
              { fromType: filter.resourceType, fromId: filter.resourceId },
              { toType: filter.resourceType, toId: filter.resourceId },
            ],
          }
        : {}),
    };

    const rows = await this.prisma.resourceRelation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filter.limit ?? 50,
    });

    return rows.map(toResourceRelationEntity);
  }

  async save(entity: ResourceRelationEntity): Promise<ResourceRelationEntity> {
    const row = await this.prisma.resourceRelation.upsert({
      where: { id: entity.id },
      create: {
        id: entity.id,
        fromType: entity.fromType,
        fromId: entity.fromId,
        toType: entity.toType,
        toId: entity.toId,
        relationType: entity.relationType,
        createdAt: new Date(entity.createdAt),
        createdBy: entity.createdBy,
      },
      update: {
        relationType: entity.relationType,
      },
    });

    return toResourceRelationEntity(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.resourceRelation.delete({ where: { id } });
  }

  async exists(
    fromType: string,
    fromId: string,
    toType: string,
    toId: string,
    relationType: string,
  ): Promise<boolean> {
    const count = await this.prisma.resourceRelation.count({
      where: { fromType, fromId, toType, toId, relationType },
    });
    return count > 0;
  }
}
