import type { ResourceRelationEntity, UrmsMode } from '@urms/shared';

export type RelationTypeCounts = Record<string, number>;

export type RelationGraphSignal = {
  activeRelations: number;
  byType: RelationTypeCounts;
};

type RelationReader = {
  list(filter: { limit?: number }, mode: UrmsMode): Promise<ResourceRelationEntity[]>;
};

const TOP_RELATION_TYPES = 3;

/** VT-2 — relationType ごとの件数（弱い信号 · 偽 narrative なし） */
export function countRelationsByType(relations: ResourceRelationEntity[]): RelationTypeCounts {
  const counts: RelationTypeCounts = {};

  for (const relation of relations) {
    const type = relation.relationType.trim();
    if (!type) continue;
    counts[type] = (counts[type] ?? 0) + 1;
  }

  return counts;
}

export function formatRelationGraphNote(signal: RelationGraphSignal): string | null {
  if (signal.activeRelations <= 0) {
    return null;
  }

  const typeSegments = Object.entries(signal.byType)
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0], 'en'))
    .slice(0, TOP_RELATION_TYPES)
    .map(([type, count]) => `${type} ${count}`);

  if (typeSegments.length === 0) {
    return `関係 ${signal.activeRelations}`;
  }

  return `関係 ${signal.activeRelations} · ${typeSegments.join(' · ')}`;
}

/** VT-2 — Resource グラフの弱い信号（件数 + タイプ内訳） */
export async function resolveRelationGraphSignal(
  relationService: RelationReader,
  mode: UrmsMode,
  limit = 500,
): Promise<RelationGraphSignal> {
  try {
    const relations = await relationService.list({ limit }, mode);
    return {
      activeRelations: relations.length,
      byType: countRelationsByType(relations),
    };
  } catch {
    return { activeRelations: 0, byType: {} };
  }
}
