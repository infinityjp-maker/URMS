import type { ContextDashboard, DayPhase, PerceptionState } from '@urms/shared';

import { hasWeatherData } from './fixtures.js';

type SynthesisOverrides = {
  weather?: PerceptionState['weather'];
  nextEvents?: PerceptionState['nextEvents'];
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
    hasWeather ? `天気 ${weather?.tempC}°C` : '天気未取得',
  ].filter(Boolean);

  return segments.join(' · ');
}

export function synthesizeAiMemo(
  currentTask: string | undefined,
  nextTask: string | undefined,
  nextEvents: PerceptionState['nextEvents'],
): string {
  const focus = nextTask ?? currentTask;
  if (!focus) {
    return 'Context の current_task / next_task が窓の正本です。未設定の場合はここに表示されません。';
  }

  const upcoming = nextEvents[0];
  if (upcoming) {
    return `${upcoming.time} ${upcoming.title} · いま: ${focus}`;
  }

  return focus;
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
