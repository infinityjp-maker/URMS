import type { Prisma, PrismaClient } from '@prisma/client';
import type { ResourceEntity } from '@urms/shared';
import type {
  ResourceListFilter,
  ResourceListResult,
  ResourceRepository,
} from '@urms/domain';

import { toPrismaStatus, toResourceEntity } from '../mappers/resource-mapper.js';

export class PrismaResourceRepository implements ResourceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByRef(resourceType: string, resourceId: string): Promise<ResourceEntity | null> {
    const row = await this.prisma.resource.findUnique({
      where: {
        resourceType_resourceId: { resourceType, resourceId },
      },
    });

    return row ? toResourceEntity(row) : null;
  }

  async list(filter: ResourceListFilter): Promise<ResourceListResult> {
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = {
      ...(filter.resourceType ? { resourceType: filter.resourceType } : {}),
      ...(filter.status ? { status: toPrismaStatus(filter.status) } : {}),
      ...(filter.q ? { name: { contains: filter.q, mode: 'insensitive' as const } } : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.resource.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.resource.count({ where }),
    ]);

    return {
      items: rows.map(toResourceEntity),
      total,
      page,
      limit,
    };
  }

  async save(entity: ResourceEntity): Promise<ResourceEntity> {
    const row = await this.prisma.resource.upsert({
      where: {
        resourceType_resourceId: {
          resourceType: entity.resourceType,
          resourceId: entity.resourceId,
        },
      },
      create: {
        resourceType: entity.resourceType,
        resourceId: entity.resourceId,
        name: entity.name,
        status: toPrismaStatus(entity.status),
        metadata: entity.metadata as Prisma.InputJsonValue,
        createdAt: new Date(entity.createdAt),
        updatedAt: new Date(entity.updatedAt),
      },
      update: {
        name: entity.name,
        status: toPrismaStatus(entity.status),
        metadata: entity.metadata as Prisma.InputJsonValue,
        updatedAt: new Date(entity.updatedAt),
      },
    });

    return toResourceEntity(row);
  }

  async exists(resourceType: string, resourceId: string): Promise<boolean> {
    const count = await this.prisma.resource.count({
      where: { resourceType, resourceId },
    });

    return count > 0;
  }
}
