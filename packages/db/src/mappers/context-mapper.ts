import type { ContextSnapshot as PrismaContextSnapshot } from '@prisma/client';
import type { ContextSnapshotItem, ContextKey } from '@urms/shared';

export function toContextSnapshotItem(row: PrismaContextSnapshot): ContextSnapshotItem {
  return {
    key: row.key as ContextKey,
    summary: row.summary,
    ssotLinks: parseSsotLinks(row.ssotLinks),
    exportContentHash: row.exportContentHash,
    updatedAt: row.updatedAt.toISOString(),
    updatedBy: row.updatedBy ?? 'system',
  };
}

function parseSsotLinks(value: unknown): ContextSnapshotItem['ssotLinks'] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is ContextSnapshotItem['ssotLinks'][number] =>
      typeof item === 'object' &&
      item !== null &&
      typeof (item as { label?: unknown }).label === 'string' &&
      typeof (item as { path?: unknown }).path === 'string',
  );
}
