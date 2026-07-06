import type { ContextDashboard, PerceptionMeta, PerceptionState } from '@urms/shared';

import { canAdvanceTask } from '../context/advance-context-task.js';
import { hasWeatherData } from '../perception/fixtures.js';

export function buildPerceptionMeta(
  dashboard: ContextDashboard,
  state: PerceptionState,
): PerceptionMeta {
  return {
    canAdvanceTask: canAdvanceTask(dashboard),
    sources: {
      context: 'api',
      scheduleEvents: state.nextEvents.length,
      weather: hasWeatherData(state.weather) ? 'live' : 'empty',
    },
  };
}
