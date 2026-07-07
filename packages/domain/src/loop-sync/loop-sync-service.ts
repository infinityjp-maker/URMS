import { readFile } from 'node:fs/promises';
import path from 'node:path';

import type { ResourceEntity, UrmsMode } from '@urms/shared';

import {
  buildLoopEntryDisplayName,
  buildLoopEntryResourceId,
  LOOP_ENTRY_RESOURCE_TYPE,
} from '../loop-journal/loop-entry-resource.js';
import type { LoopJournalEntry } from '../loop-journal/loop-journal-service.js';
import { LOOP_JOURNAL_PATH } from '../loop-journal/loop-journal-service.js';
import { parseLoopJournalMarkdown } from '../loop-journal/parse-loop-journal.js';
import type { ResourceRepository } from '../repository/resource-repository.js';

export type LoopSyncItem = {
  resourceType: string;
  resourceId: string;
  action: 'created' | 'updated' | 'skipped';
  sourcePath: string;
};

export type LoopSyncReport = {
  created: number;
  updated: number;
  skipped: number;
  items: LoopSyncItem[];
};

export type LoopSyncServiceOptions = {
  repoRoot: string;
  resourceRepository: ResourceRepository;
};

export class LoopSyncService {
  private readonly repoRoot: string;
  private readonly resourceRepository: ResourceRepository;

  constructor(options: LoopSyncServiceOptions) {
    this.repoRoot = options.repoRoot;
    this.resourceRepository = options.resourceRepository;
  }

  async sync(_actorId: string, _mode: UrmsMode = 'operate'): Promise<LoopSyncReport> {
    const report: LoopSyncReport = {
      created: 0,
      updated: 0,
      skipped: 0,
      items: [],
    };

    const journalPath = path.join(this.repoRoot, LOOP_JOURNAL_PATH);
    let raw: string;

    try {
      raw = await readFile(journalPath, 'utf8');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return report;
      }
      throw error;
    }

    const entries = parseLoopJournalMarkdown(raw);

    for (const entry of entries) {
      if (!entry.completed.trim()) {
        report.skipped += 1;
        report.items.push({
          resourceType: LOOP_ENTRY_RESOURCE_TYPE,
          resourceId: buildLoopEntryResourceId(entry.at),
          action: 'skipped',
          sourcePath: LOOP_JOURNAL_PATH,
        });
        continue;
      }

      const action = await this.upsertEntry(entry);
      report[action] += 1;
      report.items.push({
        resourceType: LOOP_ENTRY_RESOURCE_TYPE,
        resourceId: buildLoopEntryResourceId(entry.at),
        action,
        sourcePath: LOOP_JOURNAL_PATH,
      });
    }

    return report;
  }

  private async upsertEntry(entry: LoopJournalEntry): Promise<'created' | 'updated'> {
    const resourceId = buildLoopEntryResourceId(entry.at);
    const existing = await this.resourceRepository.findByRef(LOOP_ENTRY_RESOURCE_TYPE, resourceId);
    const now = new Date().toISOString();
    const entity: ResourceEntity = {
      resourceType: LOOP_ENTRY_RESOURCE_TYPE,
      resourceId,
      name: buildLoopEntryDisplayName(entry.completed),
      status: 'active',
      metadata: {
        completed: entry.completed,
        ...(entry.next ? { next: entry.next } : {}),
        actorId: entry.actorId,
        occurredAt: entry.at.toISOString(),
        sourcePath: LOOP_JOURNAL_PATH,
        ssot: 'loop-sync',
      },
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    await this.resourceRepository.save(entity);
    return existing ? 'updated' : 'created';
  }
}

export function createLoopSyncService(options: LoopSyncServiceOptions): LoopSyncService {
  return new LoopSyncService(options);
}
