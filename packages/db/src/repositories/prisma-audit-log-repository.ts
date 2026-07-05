import type { Prisma, PrismaClient } from '@prisma/client';
import type {
  AuditLogCreateInput,
  AuditLogEntry,
  AuditLogListFilter,
  AuditLogListResult,
  AuditLogRepository,
} from '@urms/domain';

export class PrismaAuditLogRepository implements AuditLogRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async append(input: AuditLogCreateInput): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        action: input.action,
        resourceType: input.resourceType,
        resourceId: input.resourceId,
        actorId: input.actorId,
        mode: input.mode,
        payload: input.payload as Prisma.InputJsonValue | undefined,
      },
    });
  }

  async list(filter: AuditLogListFilter): Promise<AuditLogListResult> {
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = {
      ...(filter.resourceType ? { resourceType: filter.resourceType } : {}),
      ...(filter.actorId ? { actorId: filter.actorId } : {}),
      ...(filter.from || filter.to
        ? {
            createdAt: {
              ...(filter.from ? { gte: new Date(filter.from) } : {}),
              ...(filter.to ? { lte: new Date(filter.to) } : {}),
            },
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      items: rows.map(toAuditLogEntry),
      total,
      page,
      limit,
    };
  }
}

function toAuditLogEntry(row: {
  id: string;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  actorId: string;
  mode: string;
  payload: unknown;
  createdAt: Date;
}): AuditLogEntry {
  return {
    id: row.id,
    action: row.action,
    resourceType: row.resourceType ?? undefined,
    resourceId: row.resourceId ?? undefined,
    actorId: row.actorId,
    mode: row.mode,
    payload: asRecord(row.payload),
    createdAt: row.createdAt.toISOString(),
  };
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return undefined;
}
