import type { ContextDashboard } from '@urms/shared';
import type { PerceptionState } from '@urms/shared';

import { resolveDayPhase, statusLineForPhase } from './day-phase.js';
import { EMPTY_WEATHER } from './fixtures.js';

export type PerceptionOverrides = {
  weather?: PerceptionState['weather'];
  nextEvents?: PerceptionState['nextEvents'];
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
  const currentPhase = findSummary(dashboard, 'current_phase');

  const tasks = [currentTask, nextTask].filter((task): task is string => Boolean(task));
  const nextEvents = overrides?.nextEvents ?? [];
  const weather = overrides?.weather ?? EMPTY_WEATHER;

  return {
    phase,
    statusLine: projectStatus ?? statusLineForPhase(phase),
    weather,
    nextEvents,
    summary: {
      conditionScore: nextEvents.length > 0 || tasks.length > 0 ? 50 : 0,
      events: nextEvents.length,
      tasks: tasks.length,
      focusHours: 0,
      travelMinutes: 0,
      weight: dashboard.activeMode === 'operate' ? '中' : '低〜中',
      focus: dashboard.activeMode === 'audit' ? '監査' : '安定',
      note: currentPhase ?? 'Context に current_phase を設定するとここに反映されます。',
    },
    tasks,
    aiMemo:
      nextTask ??
      currentTask ??
      'Context の current_task / next_task が窓の正本です。未設定の場合はここに表示されません。',
  };
}
