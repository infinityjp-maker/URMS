import type {
  ContextDashboard,
  LoopContinuity,
  PerceptionMeta,
  PerceptionState,
  WeatherCoordSource,
} from '@urms/shared';

import { canAdvanceTask } from '../context/advance-context-task.js';
import type { LoopJournalEntry } from '../loop-journal/loop-journal-service.js';
import { hasWeatherData } from '../perception/fixtures.js';
import type { RelationGraphSignal } from './graph/relation-graph-signal.js';
import { resolveLoopContinuity, synthesizeLoopContinuity } from './synthesize-loop-continuity.js';

const EMPTY_GRAPH_SIGNAL: RelationGraphSignal = { activeRelations: 0, byType: {} };

export function buildPerceptionMeta(
  dashboard: ContextDashboard,
  state: PerceptionState,
  loopJournal: LoopJournalEntry[] = [],
  now = new Date(),
  graphSignal: RelationGraphSignal = EMPTY_GRAPH_SIGNAL,
  locationLabel: string | null = null,
  weatherCoords: WeatherCoordSource | null = null,
): PerceptionMeta {
  const loopContinuity: LoopContinuity = resolveLoopContinuity(loopJournal, now);

  return {
    canAdvanceTask: canAdvanceTask(dashboard),
    sources: {
      context: 'api',
      scheduleEvents: state.nextEvents.length,
      weather: hasWeatherData(state.weather) ? 'live' : 'empty',
      weatherCoords,
      loopJournalEntries: loopJournal.length,
      loopContinuity,
      loopNarrative: synthesizeLoopContinuity(loopJournal, now),
      relations: graphSignal.activeRelations,
      relationTypes: graphSignal.byType,
      location: locationLabel,
    },
  };
}
