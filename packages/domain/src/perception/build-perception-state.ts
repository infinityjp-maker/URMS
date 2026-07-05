import type { ContextDashboard } from '@urms/shared';
import type { PerceptionState } from '@urms/shared';

import { resolveDayPhase, statusLineForPhase } from './day-phase.js';
import { DEFAULT_TASKS, PERCEPTION_FIXTURES } from './fixtures.js';

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
  const nextEvents = overrides?.nextEvents ?? PERCEPTION_FIXTURES.nextEvents;

  return {
    phase,
    statusLine: projectStatus ?? statusLineForPhase(phase),
    weather: overrides?.weather ?? PERCEPTION_FIXTURES.weather,
    nextEvents,
    summary: {
      ...PERCEPTION_FIXTURES.summary,
      events: nextEvents.length,
      weight: dashboard.activeMode === 'operate' ? '中' : '低〜中',
      focus: dashboard.activeMode === 'audit' ? '監査' : '安定',
      note: currentPhase ?? '重い負荷は予想されません。穏やかな一日になりそうです。',
    },
    tasks: tasks.length > 0 ? tasks : DEFAULT_TASKS,
    aiMemo: nextTask ?? currentTask ?? '急ぎなし、ゆるい開始。午前中は集中しやすい時間帯です。',
  };
}
