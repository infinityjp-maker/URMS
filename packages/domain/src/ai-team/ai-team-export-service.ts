import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import type { UrmsMode } from '@urms/shared';

import type { ResourceRepository } from '../repository/resource-repository.js';
import { AI_TEAM_SOURCES, fallbackNameFromPath, toRepoRelative } from './ai-team-sources.js';
import { parseResourceMarkdown } from './parse-resource-markdown.js';
import { updateMarkdownTitle } from './update-resource-markdown-title.js';

export type AiTeamExportItem = {
  resourceType: string;
  resourceId: string;
  action: 'updated' | 'unchanged' | 'skipped';
  sourcePath: string;
};

export type AiTeamExportReport = {
  updated: number;
  unchanged: number;
  skipped: number;
  items: AiTeamExportItem[];
};

export type AiTeamExportServiceOptions = {
  repoRoot: string;
  resourceRepository: ResourceRepository;
};

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
        report[item.action] += 1;
        report.items.push(item);
      }
    }

    return report;
  }

  private async exportFile(absolutePath: string, relativePath: string): Promise<AiTeamExportItem> {
    try {
      const content = await readFile(absolutePath, 'utf8');
      const parsed = parseResourceMarkdown(content, relativePath, fallbackNameFromPath(relativePath));
      if (!parsed) {
        return {
          resourceType: 'unknown',
          resourceId: path.basename(relativePath),
          action: 'skipped',
          sourcePath: relativePath,
        };
      }

      const entity = await this.resourceRepository.findByRef(parsed.resourceType, parsed.resourceId);
      if (!entity) {
        return {
          resourceType: parsed.resourceType,
          resourceId: parsed.resourceId,
          action: 'skipped',
          sourcePath: relativePath,
        };
      }

      const nextContent = updateMarkdownTitle(content, entity.name);
      if (!nextContent) {
        return {
          resourceType: parsed.resourceType,
          resourceId: parsed.resourceId,
          action: 'unchanged',
          sourcePath: relativePath,
        };
      }

      await writeFile(absolutePath, nextContent, 'utf8');
      return {
        resourceType: parsed.resourceType,
        resourceId: parsed.resourceId,
        action: 'updated',
        sourcePath: relativePath,
      };
    } catch {
      return {
        resourceType: 'unknown',
        resourceId: path.basename(relativePath),
        action: 'skipped',
        sourcePath: relativePath,
      };
    }
  }
}

export function createAiTeamExportService(options: AiTeamExportServiceOptions): AiTeamExportService {
  return new AiTeamExportService(options);
}
