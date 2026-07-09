export { buildPerceptionState, type PerceptionOverrides } from './build-perception-state.js';
export { buildPerceptionMeta } from './build-perception-meta.js';
export { synthesizeLoopContinuity, resolveLoopContinuity } from './synthesize-loop-continuity.js';
export { resolveRelationGraphSignal, formatRelationGraphNote, countRelationsByType } from './graph/relation-graph-signal.js';
export { resolveDayPhase, statusLineForPhase } from './day-phase.js';
export { adviseUmbrella, type UmbrellaAdvice, type UmbrellaAdviceInput } from './weather/umbrella-advice.js';
export {
  resolveWeatherIllustration,
  weatherIllustrationLabel,
  type WeatherIllustrationId,
} from './weather/weather-illustration.js';
export { adviseEventLeadTime, resolveScheduleEventCategory } from './schedule/event-lead-time.js';
export {
  adviseDeparture,
  adviseRoute,
  buildStationDeparturesForDay,
  createTransportService,
  formatClockTime,
  resolveTransportConfig,
  type DepartureAdviceResult,
  type RouteAdviceResult,
  type TransportConfig,
  type TransportService,
} from './transport/index.js';
export { buildDefaultContextDashboard } from '../context/context-defaults.js';
export { buildAdvanceTaskUpdates, canAdvanceTask, canAdvancePerceptionState } from '../context/advance-context-task.js';
export {
  DEV_DEMO_FIXTURES,
  EMPTY_WEATHER,
  PERCEPTION_FIXTURES,
  hasWeatherData,
} from './fixtures.js';
