import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import type { UrmsMode } from '@urms/shared';

import type { ResourceRepository } from '../repository/resource-repository.js';
import { hashContent } from '../shared/hash-content.js';
import { AI_TEAM_SOURCES, fallbackNameFromPath, toRepoRelative } from './ai-team-sources.js';
import { parseResourceMarkdown } from './parse-resource-markdown.js';
import { updateMarkdownTitle } from './update-resource-markdown-title.js';
import {
  type UrmsExportFields,
  updateUrmsExportSection,
} from './update-resource-markdown-urms-section.js';

export type AiTeamExportAction = 'updated' | 'unchanged' | 'skipped' | 'conflict';

export type AiTeamExportItem = {
  resourceType: string;
  resourceId: string;
  action: AiTeamExportAction;
  sourcePath: string;
  expectedContentHash?: string;
  actualContentHash?: string;
};

export type AiTeamExportReport = {
  updated: number;
  unchanged: number;
  skipped: number;
  conflicts: number;
  items: AiTeamExportItem[];
};

export type AiTeamExportServiceOptions = {
  repoRoot: string;
  resourceRepository: ResourceRepository;
};

function readMetadataString(metadata: Record<string, unknown>, key: string): string | undefined {
  const value = metadata[key];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export class AiTeamExportService {
  private readonly repoRoot: string;
  private readonly resourceRepository: ResourceRepository;

  constructor(options: AiTeamExportServiceOptions) {
    this.repoRoot = options.repoRoot;
    this.resourceRepository = options.resourceRepository;
  }

  /** Cursor 双方向同期 — DB Resource.name を正本 Markdown H1 に書戻し */
  async export(_actorId: string, _mode: UrmsMode = 'develop'): Promise<AiTeamExportReport> {
    const report: AiTeamExportReport = {
      updated: 0,
      unchanged: 0,
      skipped: 0,
      conflicts: 0,
      items: [],
    };

    for (const source of AI_TEAM_SOURCES) {
      let files: string[] = [];
      try {
        files = await source.resolveFiles(this.repoRoot);
      } catch {
        continue;
      }

      for (const absolutePath of files) {
        const relativePath = toRepoRelative(this.repoRoot, absolutePath);
        const item = await this.exportFile(absolutePath, relativePath);
        this.recordItem(report, item);
        report.items.push(item);
      }
    }

    return report;
  }

  private recordItem(report: AiTeamExportReport, item: AiTeamExportItem): void {
    if (item.action === 'conflict') {
      report.conflicts += 1;
      return;
    }
    report[item.action] += 1;
  }

  private async exportFile(absolutePath: string, relativePath: string): Promise<AiTeamExportItem> {
    const baseSkipped = (resourceType: string, resourceId: string): AiTeamExportItem => ({
      resourceType,
      resourceId,
      action: 'skipped',
      sourcePath: relativePath,
    });

    try {
      const content = await readFile(absolutePath, 'utf8');
      const parsed = parseResourceMarkdown(content, relativePath, fallbackNameFromPath(relativePath));
      if (!parsed) {
        return baseSkipped('unknown', path.basename(relativePath));
      }

      const entity = await this.resourceRepository.findByRef(parsed.resourceType, parsed.resourceId);
      if (!entity) {
        return baseSkipped(parsed.resourceType, parsed.resourceId);
      }

      const storedHash = readMetadataString(entity.metadata as Record<string, unknown>, 'contentHash');
      if (storedHash && storedHash !== parsed.contentHash) {
        return {
          resourceType: parsed.resourceType,
          resourceId: parsed.resourceId,
          action: 'conflict',
          sourcePath: relativePath,
          expectedContentHash: storedHash,
          actualContentHash: parsed.contentHash,
        };
      }

      const nextTitle = updateMarkdownTitle(content, entity.name);
      const metadata = entity.metadata as Record<string, unknown>;
      const exportFields: UrmsExportFields = {
        summary:
          readMetadataString(metadata, 'urmsSummary') ??
          entity.name.trim(),
        status: readMetadataString(metadata, 'urmsStatus'),
        owner: readMetadataString(metadata, 'urmsOwner'),
      };
      const nextBody = updateUrmsExportSection(nextTitle ?? content, exportFields);
      const nextContent = nextBody ?? nextTitle;

      if (!nextContent) {
        if (!storedHash) {
          await this.resourceRepository.save({
            ...entity,
            metadata: {
              ...entity.metadata,
              contentHash: parsed.contentHash,
            },
          });
        }
        return {
          resourceType: parsed.resourceType,
          resourceId: parsed.resourceId,
          action: 'unchanged',
          sourcePath: relativePath,
        };
      }

      await writeFile(absolutePath, nextContent, 'utf8');
      await this.resourceRepository.save({
        ...entity,
        metadata: {
          ...entity.metadata,
          contentHash: hashContent(nextContent),
        },
      });

      return {
        resourceType: parsed.resourceType,
        resourceId: parsed.resourceId,
        action: 'updated',
        sourcePath: relativePath,
      };
    } catch {
      return baseSkipped('unknown', path.basename(relativePath));
    }
  }
}

export function createAiTeamExportService(options: AiTeamExportServiceOptions): AiTeamExportService {
  return new AiTeamExportService(options);
}
