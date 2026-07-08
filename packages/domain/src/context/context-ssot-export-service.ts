import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import type { UrmsMode, SsotLink } from '@urms/shared';

import type { ContextRepository } from '../repository/context-repository.js';
import { hashContent } from '../shared/hash-content.js';
import { CONTEXT_SSOT_TARGETS } from './context-ssot-targets.js';
import {
  updateMarkdownSectionBoldLine,
  updateMarkdownSectionBulletLinks,
  updateMarkdownTableCell,
} from './update-context-markdown-section.js';

export type ContextSsotExportAction = 'updated' | 'unchanged' | 'skipped' | 'conflict';

export type ContextSsotExportItem = {
  key: string;
  action: ContextSsotExportAction;
  sourcePath: string;
  expectedContentHash?: string;
  actualContentHash?: string;
};

export type ContextSsotExportReport = {
  updated: number;
  unchanged: number;
  skipped: number;
  conflicts: number;
  items: ContextSsotExportItem[];
};

export type ContextSsotExportServiceOptions = {
  repoRoot: string;
  contextRepository: ContextRepository;
};

export class ContextSsotExportService {
  private readonly repoRoot: string;
  private readonly contextRepository: ContextRepository;

  constructor(options: ContextSsotExportServiceOptions) {
    this.repoRoot = options.repoRoot;
    this.contextRepository = options.contextRepository;
  }

  /** Context DB → `.cursor/context/` PM 正本へ summary を書戻し */
  async export(_actorId: string, _mode: UrmsMode = 'develop'): Promise<ContextSsotExportReport> {
    const report: ContextSsotExportReport = {
      updated: 0,
      unchanged: 0,
      skipped: 0,
      conflicts: 0,
      items: [],
    };

    const stored = await this.contextRepository.findAll();
    const byKey = new Map(stored.map((item) => [item.key, item]));

    for (const target of CONTEXT_SSOT_TARGETS) {
      const snapshot = byKey.get(target.key);
      if (!snapshot?.summary.trim()) {
        report.skipped += 1;
        report.items.push({
          key: target.key,
          action: 'skipped',
          sourcePath: target.relativePath,
        });
        continue;
      }

      const item = await this.exportTarget(target, snapshot.summary, snapshot.ssotLinks, snapshot.exportContentHash);
      this.recordItem(report, item);
      report.items.push(item);
    }

    return report;
  }

  private recordItem(report: ContextSsotExportReport, item: ContextSsotExportItem): void {
    if (item.action === 'conflict') {
      report.conflicts += 1;
      return;
    }
    report[item.action] += 1;
  }

  private async exportTarget(
    target: (typeof CONTEXT_SSOT_TARGETS)[number],
    summary: string,
    ssotLinks: SsotLink[],
    storedExportHash?: string | null,
  ): Promise<ContextSsotExportItem> {
    const absolutePath = path.join(this.repoRoot, target.relativePath);

    try {
      const content = await readFile(absolutePath, 'utf8');
      const actualHash = hashContent(content);

      if (storedExportHash && storedExportHash !== actualHash) {
        return {
          key: target.key,
          action: 'conflict',
          sourcePath: target.relativePath,
          expectedContentHash: storedExportHash,
          actualContentHash: actualHash,
        };
      }

      let nextContent =
        target.style === 'table-row' && target.rowLabel
          ? updateMarkdownTableCell(content, target.sectionHeading, target.rowLabel, summary)
          : updateMarkdownSectionBoldLine(content, target.sectionHeading, summary);

      if (target.linksSectionHeading && ssotLinks.length > 0) {
        const linkUpdate = updateMarkdownSectionBulletLinks(
          nextContent ?? content,
          target.linksSectionHeading,
          ssotLinks.map((link) => ({ label: link.label, path: link.path })),
        );
        if (linkUpdate) {
          nextContent = linkUpdate;
        }
      }

      if (!nextContent) {
        if (!storedExportHash) {
          await this.contextRepository.updateExportContentHash(target.key, actualHash);
        }
        return {
          key: target.key,
          action: 'unchanged',
          sourcePath: target.relativePath,
        };
      }

      await writeFile(absolutePath, nextContent, 'utf8');
      await this.contextRepository.updateExportContentHash(target.key, hashContent(nextContent));

      return {
        key: target.key,
        action: 'updated',
        sourcePath: target.relativePath,
      };
    } catch {
      return {
        key: target.key,
        action: 'skipped',
        sourcePath: target.relativePath,
      };
    }
  }
}

export function createContextSsotExportService(
  options: ContextSsotExportServiceOptions,
): ContextSsotExportService {
  return new ContextSsotExportService(options);
}

export type CursorCombinedExportReport = {
  aiTeam: import('../ai-team/ai-team-export-service.js').AiTeamExportReport;
  context: ContextSsotExportReport;
  conflicts: number;
};

export function sumExportConflicts(
  aiTeam: import('../ai-team/ai-team-export-service.js').AiTeamExportReport,
  context: ContextSsotExportReport,
): number {
  return aiTeam.conflicts + context.conflicts;
}
