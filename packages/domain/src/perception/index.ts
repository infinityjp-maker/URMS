export { buildPerceptionState, type PerceptionOverrides } from './build-perception-state.js';
export { buildPerceptionMeta } from './build-perception-meta.js';
export { synthesizeLoopContinuity, resolveLoopContinuity } from './synthesize-loop-continuity.js';
export { resolveRelationGraphSignal } from './graph/relation-graph-signal.js';
export { resolveDayPhase, statusLineForPhase } from './day-phase.js';
export { buildDefaultContextDashboard } from '../context/context-defaults.js';
export { buildAdvanceTaskUpdates, canAdvanceTask, canAdvancePerceptionState } from '../context/advance-context-task.js';
export {
  DEV_DEMO_FIXTURES,
  EMPTY_WEATHER,
  PERCEPTION_FIXTURES,
  hasWeatherData,
} from './fixtures.js';
