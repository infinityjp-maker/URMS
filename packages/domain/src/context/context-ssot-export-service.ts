import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import type { UrmsMode } from '@urms/shared';

import type { ContextRepository } from '../repository/context-repository.js';
import { CONTEXT_SSOT_TARGETS } from './context-ssot-targets.js';
import {
  updateMarkdownSectionBoldLine,
  updateMarkdownTableCell,
} from './update-context-markdown-section.js';

export type ContextSsotExportItem = {
  key: string;
  action: 'updated' | 'unchanged' | 'skipped';
  sourcePath: string;
};

export type ContextSsotExportReport = {
  updated: number;
  unchanged: number;
  skipped: number;
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

      const item = await this.exportTarget(target, snapshot.summary);
      report[item.action] += 1;
      report.items.push(item);
    }

    return report;
  }

  private async exportTarget(
    target: (typeof CONTEXT_SSOT_TARGETS)[number],
    summary: string,
  ): Promise<ContextSsotExportItem> {
    const absolutePath = path.join(this.repoRoot, target.relativePath);

    try {
      const content = await readFile(absolutePath, 'utf8');
      const nextContent =
        target.style === 'table-row' && target.rowLabel
          ? updateMarkdownTableCell(content, target.sectionHeading, target.rowLabel, summary)
          : updateMarkdownSectionBoldLine(content, target.sectionHeading, summary);

      if (!nextContent) {
        return {
          key: target.key,
          action: 'unchanged',
          sourcePath: target.relativePath,
        };
      }

      await writeFile(absolutePath, nextContent, 'utf8');
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
};
