import type { AiUsageRecord } from '@urms/shared';

export interface AiUsageRepository {
  append(record: Omit<AiUsageRecord, 'createdAt'>): Promise<AiUsageRecord>;
}

export class InMemoryAiUsageRepository implements AiUsageRepository {
  private readonly records: AiUsageRecord[] = [];

  async append(record: Omit<AiUsageRecord, 'createdAt'>): Promise<AiUsageRecord> {
    const saved: AiUsageRecord = {
      ...record,
      createdAt: new Date().toISOString(),
    };
    this.records.push(saved);
    return saved;
  }

  getAll(): AiUsageRecord[] {
    return [...this.records];
  }
}
