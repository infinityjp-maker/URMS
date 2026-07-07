import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import type { UrmsMode } from '@urms/shared';

import { formatLoopJournalMarkdown } from '../loop-journal/format-loop-journal-markdown.js';
import { readLoopJournalFromResources } from '../loop-journal/loop-journal-repository.js';
import { LOOP_JOURNAL_PATH } from '../loop-journal/loop-journal-service.js';
import type { ResourceRepository } from '../repository/resource-repository.js';

export type LoopExportReport = {
  entryCount: number;
  sourcePath: string;
};

export type LoopExportServiceOptions = {
  repoRoot: string;
  resourceRepository: ResourceRepository;
};

export class LoopExportService {
  private readonly journalPath: string;
  private readonly resourceRepository: ResourceRepository;

  constructor(options: LoopExportServiceOptions) {
    this.journalPath = path.join(options.repoRoot, LOOP_JOURNAL_PATH);
    this.resourceRepository = options.resourceRepository;
  }

  /** ADR-024 M4 — DB 正本の loop-entry を journal.md に上書き export */
  async export(_actorId: string, _mode: UrmsMode = 'operate'): Promise<LoopExportReport> {
    const entries = await readLoopJournalFromResources(this.resourceRepository, 0);
    const content = formatLoopJournalMarkdown(entries);

    await mkdir(path.dirname(this.journalPath), { recursive: true });
    await writeFile(this.journalPath, content, 'utf8');

    return {
      entryCount: entries.length,
      sourcePath: LOOP_JOURNAL_PATH,
    };
  }
}

export function createLoopExportService(options: LoopExportServiceOptions): LoopExportService {
  return new LoopExportService(options);
}
