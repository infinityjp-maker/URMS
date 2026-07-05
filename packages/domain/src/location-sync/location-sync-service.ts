import { readFile } from 'node:fs/promises';

import type { UrmsMode } from '@urms/shared';

import type { ResourceRepository } from '../repository/resource-repository.js';
import { parseLocationMarkdown, type ParsedLocationMarkdown } from './parse-location-markdown.js';
import {
  fallbackNameFromPath,
  resolveLocationFiles,
  toRepoRelative,
} from './location-sources.js';

export type LocationSyncItem = {
  resourceType: string;
  resourceId: string;
  action: 'created' | 'updated' | 'skipped';
  sourcePath: string;
};

export type LocationSyncReport = {
  created: number;
  updated: number;
  skipped: number;
  items: LocationSyncItem[];
};

export type LocationSyncServiceOptions = {
  repoRoot: string;
  resourceRepository: ResourceRepository;
};

export class LocationSyncService {
  private readonly repoRoot: string;
  private readonly resourceRepository: ResourceRepository;

  constructor(options: LocationSyncServiceOptions) {
    this.repoRoot = options.repoRoot;
    this.resourceRepository = options.resourceRepository;
  }

  async sync(_actorId: string, _mode: UrmsMode = 'operate'): Promise<LocationSyncReport> {
    const report: LocationSyncReport = {
      created: 0,
      updated: 0,
      skipped: 0,
      items: [],
    };

    const files = await resolveLocationFiles(this.repoRoot);

    for (const absolutePath of files) {
      const relativePath = toRepoRelative(this.repoRoot, absolutePath);
      const content = await readFile(absolutePath, 'utf8');
      const parsed = parseLocationMarkdown(content, relativePath, fallbackNameFromPath(relativePath));

      if (!parsed) {
        report.skipped += 1;
        report.items.push({
          resourceType: 'location',
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

  private async upsertResource(parsed: ParsedLocationMarkdown): Promise<'created' | 'updated'> {
    const existing = await this.resourceRepository.findByRef(parsed.resourceType, parsed.resourceId);
    const now = new Date().toISOString();

    await this.resourceRepository.save({
      resourceType: parsed.resourceType,
      resourceId: parsed.resourceId,
      name: parsed.name,
      status: 'active',
      metadata: {
        ...parsed.metadata,
        sourcePath: parsed.sourcePath,
        contentHash: parsed.contentHash,
        ssot: 'location-sync',
      },
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    });

    return existing ? 'updated' : 'created';
  }
}

export function createLocationSyncService(options: LocationSyncServiceOptions): LocationSyncService {
  return new LocationSyncService(options);
}

export { resolveLocationRepoRoot } from './location-sources.js';
