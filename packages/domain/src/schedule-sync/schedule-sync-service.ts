import { readFile } from 'node:fs/promises';

import type { ResourceEntity, UrmsMode } from '@urms/shared';

import type { ResourceRepository } from '../repository/resource-repository.js';
import { parseScheduleMarkdown, type ParsedScheduleMarkdown } from './parse-schedule-markdown.js';
import {
  fallbackNameFromPath,
  resolveScheduleFiles,
  toRepoRelative,
} from './schedule-sources.js';

export type ScheduleSyncItem = {
  resourceType: string;
  resourceId: string;
  action: 'created' | 'updated' | 'skipped';
  sourcePath: string;
};

export type ScheduleSyncReport = {
  created: number;
  updated: number;
  skipped: number;
  items: ScheduleSyncItem[];
};

export type ScheduleSyncServiceOptions = {
  repoRoot: string;
  resourceRepository: ResourceRepository;
};

export class ScheduleSyncService {
  private readonly repoRoot: string;
  private readonly resourceRepository: ResourceRepository;

  constructor(options: ScheduleSyncServiceOptions) {
    this.repoRoot = options.repoRoot;
    this.resourceRepository = options.resourceRepository;
  }

  async sync(_actorId: string, _mode: UrmsMode = 'operate'): Promise<ScheduleSyncReport> {
    const report: ScheduleSyncReport = {
      created: 0,
      updated: 0,
      skipped: 0,
      items: [],
    };

    const files = await resolveScheduleFiles(this.repoRoot);

    for (const absolutePath of files) {
      const relativePath = toRepoRelative(this.repoRoot, absolutePath);
      const content = await readFile(absolutePath, 'utf8');
      const parsed = parseScheduleMarkdown(content, relativePath, fallbackNameFromPath(relativePath));

      if (!parsed) {
        report.skipped += 1;
        report.items.push({
          resourceType: 'schedule',
          resourceId: fallbackNameFromPath(relativePath),
          action: 'skipped',
          sourcePath: relativePath,
        });
        continue;
      }

      const action = await this.upsertResource(parsed);
      report[action] += 1;
      report.items.push({
        resourceType: parsed.resourceType,
        resourceId: parsed.resourceId,
        action,
        sourcePath: relativePath,
      });
    }

    return report;
  }

  private async upsertResource(parsed: ParsedScheduleMarkdown): Promise<'created' | 'updated'> {
    const existing = await this.resourceRepository.findByRef(parsed.resourceType, parsed.resourceId);
    const now = new Date().toISOString();
    const entity: ResourceEntity = {
      resourceType: parsed.resourceType,
      resourceId: parsed.resourceId,
      name: parsed.name,
      status: 'active',
      metadata: {
        ...parsed.metadata,
        sourcePath: parsed.sourcePath,
        contentHash: parsed.contentHash,
        ssot: 'schedule-sync',
      },
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    await this.resourceRepository.save(entity);
    return existing ? 'updated' : 'created';
  }
}

export function createScheduleSyncService(options: ScheduleSyncServiceOptions): ScheduleSyncService {
  return new ScheduleSyncService(options);
}

export { resolveScheduleRepoRoot } from './schedule-sources.js';
