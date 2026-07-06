import type { UrmsMode } from '@urms/shared';

export type RelationGraphSignal = {
  activeRelations: number;
};

type RelationReader = {
  list(filter: { limit?: number }, mode: UrmsMode): Promise<unknown[]>;
};

/** VT-2 — Resource グラフの弱い信号（件数のみ · 偽 narrative なし） */
export async function resolveRelationGraphSignal(
  relationService: RelationReader,
  mode: UrmsMode,
  limit = 500,
): Promise<RelationGraphSignal> {
  try {
    const relations = await relationService.list({ limit }, mode);
    return { activeRelations: relations.length };
  } catch {
    return { activeRelations: 0 };
  }
}
