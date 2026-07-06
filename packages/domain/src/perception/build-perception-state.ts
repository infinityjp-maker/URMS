import type { ContextDashboard } from '@urms/shared';
import type { PerceptionState } from '@urms/shared';

import type { LoopJournalEntry } from '../loop-journal/loop-journal-service.js';
import { resolveDayPhase, statusLineForPhase } from './day-phase.js';
import { EMPTY_WEATHER, hasWeatherData } from './fixtures.js';
import type { RelationGraphSignal } from './graph/relation-graph-signal.js';
import {
  synthesizeAiMemo,
  synthesizeConditionScore,
  synthesizeSummaryNote,
} from './synthesize-context-note.js';

export type PerceptionOverrides = {
  weather?: PerceptionState['weather'];
  nextEvents?: PerceptionState['nextEvents'];
  loopJournal?: LoopJournalEntry[];
  graphSignal?: RelationGraphSignal;
  locationLabel?: string | null;
};

function findSummary(dashboard: ContextDashboard, key: string): string | undefined {
  return dashboard.items.find((item) => item.key === key)?.summary;
}

/** Context Dashboard + 時間帯 → 知覚層ペイロード（本番 UI / API 共通） */
export function buildPerceptionState(
  dashboard: ContextDashboard,
  now = new Date(),
  overrides?: PerceptionOverrides,
): PerceptionState {
  const phase = resolveDayPhase(now);
  const projectStatus = findSummary(dashboard, 'project_status');
  const currentTask = findSummary(dashboard, 'current_task');
  const nextTask = findSummary(dashboard, 'next_task');

  const tasks = [currentTask, nextTask].filter((task): task is string => Boolean(task));
  const nextEvents = overrides?.nextEvents ?? [];
  const weather = overrides?.weather ?? EMPTY_WEATHER;
  const hasWeather = hasWeatherData(weather);

  return {
    phase,
    statusLine: projectStatus ?? statusLineForPhase(phase),
    weather,
    nextEvents,
    summary: {
      conditionScore: synthesizeConditionScore(nextEvents.length, tasks.length, hasWeather),
      events: nextEvents.length,
      tasks: tasks.length,
      focusHours: 0,
      travelMinutes: 0,
      weight: dashboard.activeMode === 'operate' ? '中' : '低〜中',
      focus: dashboard.activeMode === 'audit' ? '監査' : '安定',
      note: synthesizeSummaryNote(dashboard, phase, { ...overrides, now }),
    },
    tasks,
    aiMemo: synthesizeAiMemo(currentTask, nextTask, nextEvents, overrides?.loopJournal, now),
  };
}
