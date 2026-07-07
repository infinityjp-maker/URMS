import type { ResourceRef } from './resource.js';

/** Contract §5.3 — 代表 relationType（拡張可 · snake_case） */
export const RESOURCE_RELATION_TYPES = [
  'depends_on',
  'owned_by',
  'governed_by',
  'provided_by',
  'generated_from',
  'member_of',
  'relates_to',
] as const;

export type ResourceRelationType = (typeof RESOURCE_RELATION_TYPES)[number];

export interface ResourceRelationEntity {
  id: string;
  fromType: string;
  fromId: string;
  toType: string;
  toId: string;
  relationType: string;
  createdAt: string;
  createdBy?: string;
}

export interface ResourceRelationEndpoints extends ResourceRef {
  toType: string;
  toId: string;
  relationType: string;
}

export function formatRelationEndpoints(relation: Pick<ResourceRelationEntity, 'fromType' | 'fromId' | 'toType' | 'toId'>): string {
  return `${relation.fromType}:${relation.fromId} → ${relation.toType}:${relation.toId}`;
}
