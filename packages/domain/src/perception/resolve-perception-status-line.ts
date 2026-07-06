import type { ContextDashboard, DayPhase } from '@urms/shared';

import type { LoopJournalEntry } from '../loop-journal/loop-journal-service.js';
import { statusLineForPhase } from './day-phase.js';
import { resolveLoopContinuity, synthesizeLoopContinuity } from './synthesize-loop-continuity.js';

function findSummary(dashboard: ContextDashboard, key: string): string | undefined {
  return dashboard.items.find((item) => item.key === key)?.summary;
}

/** VT-4 — project_status · journal 連続性 · 時間帯から statusLine を合成 */
export function resolvePerceptionStatusLine(
  dashboard: ContextDashboard,
  phase: DayPhase,
  loopJournal: LoopJournalEntry[] = [],
  now = new Date(),
): string {
  const projectStatus = findSummary(dashboard, 'project_status');

  if (projectStatus?.includes('直近ループ')) {
    return projectStatus;
  }

  if (loopJournal.length > 0) {
    const continuity = resolveLoopContinuity(loopJournal, now);
    const loopNarrative = synthesizeLoopContinuity(loopJournal, now);

    if (loopNarrative && (continuity === 'new-day' || continuity === 'looped-today')) {
      return loopNarrative;
    }
  }

  return projectStatus ?? statusLineForPhase(phase);
}
