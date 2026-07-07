import { appendFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

import type { ContextDashboard, UrmsMode } from '@urms/shared';

import {
  createCompositeLoopJournalReader,
  type LoopJournalReader,
} from './loop-journal-repository.js';
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
  /** ADR-024 M2 — 未指定時は file のみ */
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
  const stamp = entry.at.toLocaleString('ja-JP', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const nextPart = entry.next ? ` → 次: ${entry.next}` : '';
  return `- ${stamp} · 完了: ${entry.completed}${nextPart} (${entry.actorId})\n`;
}

export class LoopJournalService {
  private readonly journalPath: string;
  private readonly persistLoopEntry?: LoopEntryPersister;
  private readonly journalReader: LoopJournalReader;

  constructor(options: LoopJournalServiceOptions) {
    this.journalPath = path.join(options.repoRoot, LOOP_JOURNAL_PATH);
    this.persistLoopEntry = options.persistLoopEntry;
    this.journalReader =
      options.journalReader ??
      createCompositeLoopJournalReader({
        repoRoot: options.repoRoot,
        resourceRepository: options.resourceRepository,
      });
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

    await this.append(entry);
    if (this.persistLoopEntry) {
      await this.persistLoopEntry(entry, actorId, mode);
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
