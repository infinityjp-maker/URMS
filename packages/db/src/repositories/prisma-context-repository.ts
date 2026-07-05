import type { Prisma, PrismaClient } from '@prisma/client';
import type { ContextKey, ContextSnapshotItem } from '@urms/shared';
import type { ContextRepository } from '@urms/domain';

import { toContextSnapshotItem } from '../mappers/context-mapper.js';

export class PrismaContextRepository implements ContextRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByKey(key: ContextKey): Promise<ContextSnapshotItem | null> {
    const row = await this.prisma.contextSnapshot.findUnique({
      where: { key },
    });

    return row ? toContextSnapshotItem(row) : null;
  }

  async findAll(): Promise<ContextSnapshotItem[]> {
    const rows = await this.prisma.contextSnapshot.findMany({
      orderBy: { key: 'asc' },
    });

    return rows.map(toContextSnapshotItem);
  }

  async upsert(item: ContextSnapshotItem): Promise<ContextSnapshotItem> {
    const row = await this.prisma.contextSnapshot.upsert({
      where: { key: item.key },
      create: {
        key: item.key,
        summary: item.summary,
        ssotLinks: item.ssotLinks as unknown as Prisma.InputJsonValue,
        updatedAt: new Date(item.updatedAt),
        updatedBy: item.updatedBy,
      },
      update: {
        summary: item.summary,
        ssotLinks: item.ssotLinks as unknown as Prisma.InputJsonValue,
        updatedAt: new Date(item.updatedAt),
        updatedBy: item.updatedBy,
      },
    });

    return toContextSnapshotItem(row);
  }
}
