/** ADR-024 — loop journal の正本モード */
export type LoopJournalSsotMode = 'dual-write' | 'resource-export';

/** M4 以降の既定: Resource（DB）正本 · journal.md は export のみ */
export function resolveLoopJournalSsotMode(env: NodeJS.ProcessEnv = process.env): LoopJournalSsotMode {
  const raw = env.URMS_LOOP_SSOT?.trim().toLowerCase();

  if (raw === 'dual-write' || raw === 'file') {
    return 'dual-write';
  }

  return 'resource-export';
}
