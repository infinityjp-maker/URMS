import type { ContextDashboard, DayPhase, PerceptionState } from '@urms/shared';

import type { LoopJournalEntry } from '../loop-journal/loop-journal-service.js';
import { hasWeatherData } from './fixtures.js';
import type { RelationGraphSignal } from './graph/relation-graph-signal.js';
import { formatRelationGraphNote } from './graph/relation-graph-signal.js';
import { synthesizeLoopContinuity } from './synthesize-loop-continuity.js';

type SynthesisOverrides = {
  weather?: PerceptionState['weather'];
  nextEvents?: PerceptionState['nextEvents'];
  loopJournal?: LoopJournalEntry[];
  graphSignal?: RelationGraphSignal;
  locationLabel?: string | null;
  now?: Date;
  /** statusLine に loop narrative を出しているとき summary から省略 */
  omitLoopContinuity?: boolean;
};

const PHASE_LABELS: Record<DayPhase, string> = {
  morning: '朝',
  day: '昼',
  evening: '夕',
  night: '夜',
};

function findSummary(dashboard: ContextDashboard, key: string): string | undefined {
  return dashboard.items.find((item) => item.key === key)?.summary;
}

/** VT-2 — Context + 時間 + Resource 信号から「今」の narrative を合成 */
export function synthesizeSummaryNote(
  dashboard: ContextDashboard,
  phase: DayPhase,
  overrides?: SynthesisOverrides,
): string {
  const currentPhase = findSummary(dashboard, 'current_phase');
  const events = overrides?.nextEvents ?? [];
  const weather = overrides?.weather;
  const hasWeather = weather ? hasWeatherData(weather) : false;
  const currentTask = findSummary(dashboard, 'current_task');
  const taskCount = [currentTask, findSummary(dashboard, 'next_task')].filter(Boolean).length;

  const segments = [
    currentPhase,
    `${PHASE_LABELS[phase]} · 予定 ${events.length} · タスク ${taskCount}`,
    overrides?.graphSignal ? formatRelationGraphNote(overrides.graphSignal) : null,
    overrides?.locationLabel ? `地点 ${overrides.locationLabel}` : null,
    hasWeather ? `天気 ${weather?.tempC}°C` : '天気未取得',
    overrides?.loopJournal?.length && !overrides.omitLoopContinuity
      ? synthesizeLoopContinuity(overrides.loopJournal, overrides.now)
      : null,
  ].filter(Boolean);

  return segments.join(' · ');
}

export function synthesizeAiMemo(
  currentTask: string | undefined,
  nextTask: string | undefined,
  nextEvents: PerceptionState['nextEvents'],
  loopJournal?: LoopJournalEntry[],
  now = new Date(),
): string {
  const focus = nextTask ?? currentTask;
  if (!focus) {
    return 'Context の current_task / next_task が窓の正本です。未設定の場合はここに表示されません。';
  }

  const upcoming = nextEvents[0];
  const upcomingLine = upcoming
    ? upcoming.note
      ? `${upcoming.time} ${upcoming.title} (${upcoming.note})`
      : `${upcoming.time} ${upcoming.title}`
    : null;
  const loopLine = loopJournal?.length ? synthesizeLoopContinuity(loopJournal, now) : null;
  const focusLine = upcomingLine ? `${upcomingLine} · いま: ${focus}` : focus;

  if (loopLine) {
    return `${loopLine} · ${focusLine}`;
  }

  return focusLine;
}

export function synthesizeConditionScore(
  eventCount: number,
  taskCount: number,
  hasWeather: boolean,
): number {
  let score = 0;
  if (taskCount > 0) score += 30;
  if (eventCount > 0) score += 20;
  if (hasWeather) score += 20;
  return Math.min(100, score);
}
