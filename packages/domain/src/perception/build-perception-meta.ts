import type { ContextDashboard, LoopContinuity, PerceptionMeta, PerceptionState } from '@urms/shared';

import { canAdvanceTask } from '../context/advance-context-task.js';
import type { LoopJournalEntry } from '../loop-journal/loop-journal-service.js';
import { hasWeatherData } from '../perception/fixtures.js';
import { resolveLoopContinuity } from './synthesize-loop-continuity.js';

export function buildPerceptionMeta(
  dashboard: ContextDashboard,
  state: PerceptionState,
  loopJournal: LoopJournalEntry[] = [],
  now = new Date(),
  graphRelations = 0,
): PerceptionMeta {
  const loopContinuity: LoopContinuity = resolveLoopContinuity(loopJournal, now);

  return {
    canAdvanceTask: canAdvanceTask(dashboard),
    sources: {
      context: 'api',
      scheduleEvents: state.nextEvents.length,
      weather: hasWeatherData(state.weather) ? 'live' : 'empty',
      loopJournalEntries: loopJournal.length,
      loopContinuity,
      relations: graphRelations,
    },
  };
}
