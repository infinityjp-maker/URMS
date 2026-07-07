export {
  type AuditLogRepository,
  type AuditLogCreateInput,
  type AuditLogEntry,
  type AuditLogListFilter,
  type AuditLogListResult,
  type AuditAction,
} from './audit/audit-log-repository.js';
export { AuditHandler, registerAuditHandlers } from './audit/audit-handler.js';

export { createDomainCore, type DomainCore } from './domain-core.js';

export { canTransition, assertValidTransition, getAllowedTransitions } from './resource/lifecycle.js';
export { ResourceService, type CreateResourceInput, type UpdateResourceInput } from './resource/resource-service.js';
export {
  RelationService,
  type CreateRelationInput,
  type RelationListFilter,
  type RelationRepository,
} from './resource/relation-service.js';
export { assertValidRelationType, validateRelationEndpoints } from './resource/relation-validator.js';

export { ContextService } from './context/context-service.js';
export { buildAdvanceTaskUpdates, canAdvanceTask } from './context/advance-context-task.js';
export { buildPerceptionState, type PerceptionOverrides } from './perception/build-perception-state.js';
export { resolveDayPhase, statusLineForPhase } from './perception/day-phase.js';
export { createWeatherService, OpenMeteoWeatherService, type WeatherService } from './perception/weather/weather-service.js';
export { resolveWeatherConfig, type WeatherConfig } from './perception/weather/weather-config.js';
export { buildWeatherHint } from './perception/weather/weather-hint.js';
export { buildOpenMeteoUrl, mapOpenMeteoResponse } from './perception/weather/open-meteo.js';
export { createScheduleService, ResourceScheduleService, type ScheduleService } from './perception/schedule/schedule-service.js';
export {
  resolveScheduleConfig,
  SCHEDULE_RESOURCE_TYPE,
  type ScheduleConfig,
} from './perception/schedule/schedule-config.js';
export {
  mapScheduleResourceToEvent,
  mapScheduleResourcesToEvents,
  formatRelativeEventNote,
  buildDailyOccurrence,
} from './perception/schedule/map-schedule-resources.js';
export { createAiTeamSyncService, AiTeamSyncService, resolveAiTeamRepoRoot, AI_TEAM_ID } from './ai-team/ai-team-sync-service.js';
export type { AiTeamSyncReport, AiTeamSyncItem } from './ai-team/ai-team-sync-service.js';
export {
  createScheduleSyncService,
  ScheduleSyncService,
  resolveScheduleRepoRoot,
} from './schedule-sync/schedule-sync-service.js';
export type { ScheduleSyncReport, ScheduleSyncItem } from './schedule-sync/schedule-sync-service.js';
export { parseScheduleMarkdown } from './schedule-sync/parse-schedule-markdown.js';
export { SCHEDULE_SOURCE_DIR } from './schedule-sync/schedule-sources.js';
export {
  createLocationSyncService,
  LocationSyncService,
  resolveLocationRepoRoot,
} from './location-sync/location-sync-service.js';
export type { LocationSyncReport, LocationSyncItem } from './location-sync/location-sync-service.js';
export { parseLocationMarkdown } from './location-sync/parse-location-markdown.js';
export { LOCATION_SOURCE_DIR } from './location-sync/location-sources.js';
export {
  LOCATION_RESOURCE_TYPE,
  resolveWeatherConfigWithLocation,
  weatherConfigFromLocationResource,
  pickPrimaryLocation,
  pickPrimaryLocationLabel,
  resolvePrimaryLocationForMode,
  resolvePrimaryLocationLabel,
  resolvePrimaryLocationLabelForMode,
} from './perception/weather/resolve-weather-config.js';
export type { PrimaryLocation } from './perception/weather/resolve-weather-config.js';
export {
  buildReverseGeocodeUrl,
  formatPlaceName,
  reverseGeocodePlaceName,
} from './perception/place/reverse-geocode.js';
export { resolvePlaceName } from './perception/place/resolve-place-name.js';
export { buildPerceptionMeta } from './perception/build-perception-meta.js';
export {
  synthesizeLoopContinuity,
  resolveLoopContinuity,
  calendarDayKey,
} from './perception/synthesize-loop-continuity.js';
export {
  createLoopJournalService,
  LoopJournalService,
  resolveLoopJournalRepoRoot,
  extractLoopJournalEntry,
  LOOP_JOURNAL_PATH,
} from './loop-journal/loop-journal-service.js';
export { resolveRelationGraphSignal, formatRelationGraphNote, countRelationsByType } from './perception/graph/relation-graph-signal.js';
export type { RelationGraphSignal, RelationTypeCounts } from './perception/graph/relation-graph-signal.js';
export { parseLoopJournalMarkdown } from './loop-journal/parse-loop-journal.js';
export type { LoopJournalEntry } from './loop-journal/loop-journal-service.js';
export { parseResourceMarkdown } from './ai-team/parse-resource-markdown.js';
export {
  validateContextUpdateItems,
  validateSummary,
  validateSsotLinks,
} from './context/context-validator.js';

export { modePolicy, assertModeAllowed, type ModePolicy } from './mode/mode-policy.js';

export type { IntegrationAdapter, IntegrationHealth, IntegrationSummary } from './integration/integration-adapter.js';
export { IntegrationRegistry } from './integration/integration-registry.js';
export { CursorLocalIntegration, type CursorIntegrationOptions } from './integration/cursor-local-integration.js';

export { DOMAIN_EVENT_VERSION, createDomainEvent, type DomainEvent } from './event/domain-event.js';
export { EVENT_TYPES, type EventType } from './event/event-types.js';
export { InProcessEventBus, type EventBus, type EventHandler } from './event/event-bus.js';

export {
  type ResourceRepository,
  type ResourceListFilter,
  type ResourceListResult,
} from './repository/resource-repository.js';
export { type ContextRepository } from './repository/context-repository.js';
export { type UserRepository, type StoredUser } from './repository/user-repository.js';

export { LocalAuthService, type LocalAuthServiceOptions } from './auth/local-auth-service.js';

export type { AiProviderAdapter, AiFetch } from './ai/adapter.js';
export { AiProviderRegistry } from './ai/provider-registry.js';
export { AiManager, type AiManagerOptions } from './ai/ai-manager.js';
export {
  type AiUsageRepository,
  InMemoryAiUsageRepository,
} from './ai/ai-usage-repository.js';

export type { ResourceTypePlugin } from './plugin/resource-type-plugin.js';
export {
  PluginRegistry,
  assertPluginValidation,
} from './plugin/plugin-registry.js';
