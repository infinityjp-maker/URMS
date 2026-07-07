import { appendFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

import type { ContextDashboard, UrmsMode } from '@urms/shared';

import { formatLoopJournalLine } from './format-loop-journal-markdown.js';
import {
  createCompositeLoopJournalReader,
  createResourceOnlyLoopJournalReader,
  type LoopJournalReader,
} from './loop-journal-repository.js';
import type { LoopJournalSsotMode } from './loop-journal-ssot-mode.js';
import { resolveLoopJournalSsotMode } from './loop-journal-ssot-mode.js';
import type { ResourceRepository } from '../repository/resource-repository.js';

export const LOOP_JOURNAL_PATH = '.cursor/resources/loop/journal.md';

export type LoopJournalEntry = {
  completed: string;
  next?: string;
  actorId: string;
  at: Date;
};

export type LoopEntryPersister = (
  entry: LoopJournalEntry,
  actorId: string,
  mode: UrmsMode,
) => Promise<void>;

export type LoopJournalServiceOptions = {
  repoRoot: string;
  persistLoopEntry?: LoopEntryPersister;
  /** ADR-024 M4 — 未指定時は env URMS_LOOP_SSOT（既定 resource-export） */
  ssotMode?: LoopJournalSsotMode;
  /** ADR-024 M4 — resource-export 時 advance 後に journal.md を再生成 */
  exportJournal?: () => Promise<void>;
  /** ADR-024 M2 — 未指定時は ssotMode に応じて reader を構築 */
  journalReader?: LoopJournalReader;
  resourceRepository?: ResourceRepository;
};

function findSummary(dashboard: ContextDashboard, key: string): string | undefined {
  return dashboard.items.find((item) => item.key === key)?.summary;
}

export function extractLoopJournalEntry(
  before: ContextDashboard,
  after: ContextDashboard,
  actorId: string,
  at = new Date(),
): LoopJournalEntry | null {
  const completed = findSummary(before, 'current_task');
  if (!completed?.trim()) {
    return null;
  }

  const next = findSummary(after, 'current_task');
  if (next === completed) {
    return null;
  }

  return {
    completed,
    next: next && next !== completed ? next : undefined,
    actorId,
    at,
  };
}

function formatJournalLine(entry: LoopJournalEntry): string {
  return `${formatLoopJournalLine(entry)}\n`;
}

export class LoopJournalService {
  private readonly journalPath: string;
  private readonly persistLoopEntry?: LoopEntryPersister;
  private readonly journalReader: LoopJournalReader;
  private readonly ssotMode: LoopJournalSsotMode;
  private readonly exportJournal?: () => Promise<void>;

  constructor(options: LoopJournalServiceOptions) {
    this.journalPath = path.join(options.repoRoot, LOOP_JOURNAL_PATH);
    this.persistLoopEntry = options.persistLoopEntry;
    this.ssotMode = options.ssotMode ?? resolveLoopJournalSsotMode();
    this.exportJournal = options.exportJournal;

    if (options.journalReader) {
      this.journalReader = options.journalReader;
    } else if (this.ssotMode === 'resource-export' && options.resourceRepository) {
      this.journalReader = createResourceOnlyLoopJournalReader(options.resourceRepository);
    } else {
      this.journalReader = createCompositeLoopJournalReader({
        repoRoot: options.repoRoot,
        resourceRepository: options.resourceRepository,
      });
    }
  }

  async append(entry: LoopJournalEntry): Promise<void> {
    await mkdir(path.dirname(this.journalPath), { recursive: true });
    await appendFile(this.journalPath, formatJournalLine(entry), 'utf8');
  }

  async recordAdvance(
    before: ContextDashboard,
    after: ContextDashboard,
    actorId: string,
    mode: UrmsMode = 'operate',
    at = new Date(),
  ): Promise<LoopJournalEntry | null> {
    const entry = extractLoopJournalEntry(before, after, actorId, at);
    if (!entry) {
      return null;
    }

    if (this.ssotMode === 'dual-write') {
      await this.append(entry);
    }

    if (this.persistLoopEntry) {
      await this.persistLoopEntry(entry, actorId, mode);
    }

    if (this.ssotMode === 'resource-export' && this.exportJournal) {
      await this.exportJournal();
    }

    return entry;
  }

  async readRecent(limit = 20): Promise<LoopJournalEntry[]> {
    return this.journalReader.readRecent(limit);
  }
}

export function createLoopJournalService(options: LoopJournalServiceOptions): LoopJournalService {
  return new LoopJournalService(options);
}

export function resolveLoopJournalRepoRoot(env: NodeJS.ProcessEnv = process.env): string {
  if (env.URMS_REPO_ROOT?.trim()) {
    return path.resolve(env.URMS_REPO_ROOT);
  }

  return path.resolve(process.cwd());
}
