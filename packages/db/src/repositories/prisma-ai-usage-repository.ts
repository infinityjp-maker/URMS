import type { PrismaClient } from '@prisma/client';
import type { AiUsageRecord } from '@urms/shared';
import type { AiUsageRepository } from '@urms/domain';

export class PrismaAiUsageRepository implements AiUsageRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async append(record: Omit<AiUsageRecord, 'createdAt'>): Promise<AiUsageRecord> {
    const row = await this.prisma.aiUsageLog.create({
      data: {
        providerId: record.providerId,
        modelId: record.modelId,
        promptTokens: record.promptTokens,
        completionTokens: record.completionTokens,
        latencyMs: record.latencyMs,
        costUsd: record.costUsd,
        actorId: record.actorId,
        mode: record.mode,
      },
    });

    return {
      providerId: row.providerId,
      modelId: row.modelId,
      promptTokens: row.promptTokens,
      completionTokens: row.completionTokens,
      latencyMs: row.latencyMs,
      costUsd: row.costUsd ? Number(row.costUsd) : undefined,
      actorId: row.actorId,
      mode: row.mode,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
