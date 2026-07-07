import { AppError, ERROR_CODES, type ResourceEntity, type UrmsMode } from '@urms/shared';

import type { CreateResourceInput, ResourceService } from '../resource/resource-service.js';
import type { LoopJournalEntry } from './loop-journal-service.js';
import { LOOP_JOURNAL_PATH } from './loop-journal-service.js';

export const LOOP_ENTRY_RESOURCE_TYPE = 'loop-entry';

export function buildLoopEntryResourceId(at: Date): string {
  return `loop:${at.toISOString()}`;
}

export function buildLoopEntryDisplayName(completed: string): string {
  const trimmed = completed.trim();
  if (trimmed.length <= 40) {
    return trimmed;
  }

  return `${trimmed.slice(0, 37)}...`;
}

export function toLoopEntryResourceInput(entry: LoopJournalEntry): CreateResourceInput {
  return {
    resourceType: LOOP_ENTRY_RESOURCE_TYPE,
    resourceId: buildLoopEntryResourceId(entry.at),
    name: buildLoopEntryDisplayName(entry.completed),
    metadata: {
      completed: entry.completed,
      ...(entry.next ? { next: entry.next } : {}),
      actorId: entry.actorId,
      occurredAt: entry.at.toISOString(),
      sourcePath: LOOP_JOURNAL_PATH,
      ssot: 'loop-resource-ssot',
    },
  };
}

export function fromLoopEntryResource(entity: ResourceEntity): LoopJournalEntry | null {
  if (entity.resourceType !== LOOP_ENTRY_RESOURCE_TYPE) {
    return null;
  }

  if (entity.status !== 'active') {
    return null;
  }

  const completed = entity.metadata.completed;
  const actorId = entity.metadata.actorId;
  const occurredAt = entity.metadata.occurredAt;

  if (typeof completed !== 'string' || !completed.trim()) {
    return null;
  }
  if (typeof actorId !== 'string' || !actorId.trim()) {
    return null;
  }
  if (typeof occurredAt !== 'string' || !occurredAt.trim()) {
    return null;
  }

  const at = new Date(occurredAt);
  if (Number.isNaN(at.getTime())) {
    return null;
  }

  const next = entity.metadata.next;
  return {
    completed,
    next: typeof next === 'string' && next.trim() ? next : undefined,
    actorId,
    at,
  };
}

/** ADR-024 M1 — journal.md 追記と同時に loop-entry Resource を作成 */
export async function persistLoopEntryResource(
  resourceService: ResourceService,
  entry: LoopJournalEntry,
  actorId: string,
  mode: UrmsMode,
): Promise<ResourceEntity | null> {
  const input = toLoopEntryResourceInput(entry);

  try {
    const created = await resourceService.create(input, actorId, mode);
    return resourceService.changeLifecycle(
      LOOP_ENTRY_RESOURCE_TYPE,
      created.resourceId,
      'active',
      actorId,
      mode,
    );
  } catch (error) {
    if (error instanceof AppError && error.code === ERROR_CODES.RESOURCE_DUPLICATE_ID) {
      return null;
    }

    throw error;
  }
}
