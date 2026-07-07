import { readFile } from 'node:fs/promises';
import path from 'node:path';

import type { ResourceEntity } from '@urms/shared';

import type { ResourceRepository } from '../repository/resource-repository.js';
import {
  fromLoopEntryResource,
  LOOP_ENTRY_RESOURCE_TYPE,
} from './loop-entry-resource.js';
import type { LoopJournalEntry } from './loop-journal-service.js';
import { LOOP_JOURNAL_PATH } from './loop-journal-service.js';
import { parseLoopJournalMarkdown } from './parse-loop-journal.js';

export interface LoopJournalReader {
  readRecent(limit: number): Promise<LoopJournalEntry[]>;
}

export type LoopJournalReaderOptions = {
  repoRoot: string;
  resourceRepository?: ResourceRepository;
};

export function loopJournalEntryKey(entry: LoopJournalEntry): string {
  return `${entry.at.toISOString()}|${entry.completed.trim()}`;
}

/** Resource 優先 · 同一キーは Resource が上書き · 時系列で limit 件 */
export function mergeLoopJournalEntries(
  resourceEntries: LoopJournalEntry[],
  fileEntries: LoopJournalEntry[],
  limit: number,
): LoopJournalEntry[] {
  const byKey = new Map<string, LoopJournalEntry>();

  for (const entry of fileEntries) {
    byKey.set(loopJournalEntryKey(entry), entry);
  }
  for (const entry of resourceEntries) {
    byKey.set(loopJournalEntryKey(entry), entry);
  }

  return [...byKey.values()]
    .sort((left, right) => left.at.getTime() - right.at.getTime())
    .slice(-Math.max(limit, 0));
}

export async function readLoopJournalFromFile(
  repoRoot: string,
  limit: number,
): Promise<LoopJournalEntry[]> {
  const journalPath = path.join(repoRoot, LOOP_JOURNAL_PATH);

  try {
    const raw = await readFile(journalPath, 'utf8');
    const entries = parseLoopJournalMarkdown(raw);
    if (limit <= 0) {
      return entries;
    }
    return entries.slice(-limit);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

export async function readLoopJournalFromResources(
  resourceRepository: ResourceRepository,
  limit: number,
): Promise<LoopJournalEntry[]> {
  const fetchLimit = limit <= 0 ? 500 : Math.max(limit * 2, 50);
  const result = await resourceRepository.list({
    resourceType: LOOP_ENTRY_RESOURCE_TYPE,
    status: 'active',
    limit: fetchLimit,
    page: 1,
  });

  const entries = result.items
    .map((entity) => fromLoopEntryResource(entity))
    .filter((entry): entry is LoopJournalEntry => entry !== null)
    .sort((left, right) => left.at.getTime() - right.at.getTime());

  if (limit <= 0) {
    return entries;
  }

  return entries.slice(-limit);
}

export function createResourceOnlyLoopJournalReader(
  resourceRepository: ResourceRepository,
): LoopJournalReader {
  return {
    async readRecent(limit: number): Promise<LoopJournalEntry[]> {
      return readLoopJournalFromResources(resourceRepository, limit);
    },
  };
}

export function createCompositeLoopJournalReader(
  options: LoopJournalReaderOptions,
): LoopJournalReader {
  const { repoRoot, resourceRepository } = options;

  return {
    async readRecent(limit: number): Promise<LoopJournalEntry[]> {
      const fileEntries = await readLoopJournalFromFile(repoRoot, limit);

      if (!resourceRepository) {
        return fileEntries;
      }

      try {
        const resourceEntries = await readLoopJournalFromResources(resourceRepository, limit);
        if (resourceEntries.length === 0) {
          return fileEntries;
        }

        return mergeLoopJournalEntries(resourceEntries, fileEntries, limit);
      } catch {
        return fileEntries;
      }
    },
  };
}

export function mapLoopEntryResources(entities: ResourceEntity[]): LoopJournalEntry[] {
  return entities
    .map((entity) => fromLoopEntryResource(entity))
    .filter((entry): entry is LoopJournalEntry => entry !== null);
}
