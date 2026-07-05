import type { ContextKey, ContextSnapshotItem } from '@urms/shared';

export interface ContextRepository {
  findByKey(key: ContextKey): Promise<ContextSnapshotItem | null>;
  findAll(): Promise<ContextSnapshotItem[]>;
  upsert(item: ContextSnapshotItem): Promise<ContextSnapshotItem>;
}
