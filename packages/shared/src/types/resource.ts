/** Resource ライフサイクル（Contract §5.2） */
export const RESOURCE_STATUSES = ['draft', 'active', 'deprecated', 'archived'] as const;

export type ResourceStatus = (typeof RESOURCE_STATUSES)[number];

/** Resource 参照（Contract §5.1） */
export interface ResourceRef {
  resourceType: string;
  resourceId: string;
}

/** Resource エンティティ骨格（S2 で拡張） */
export interface ResourceEntity extends ResourceRef {
  name: string;
  status: ResourceStatus;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export function formatResourceRef(ref: ResourceRef): string {
  return `${ref.resourceType}:${ref.resourceId}`;
}
