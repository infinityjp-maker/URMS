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

export { ContextService } from './context/context-service.js';
export {
  validateContextUpdateItems,
  validateSummary,
  validateSsotLinks,
} from './context/context-validator.js';

export { modePolicy, assertModeAllowed, type ModePolicy } from './mode/mode-policy.js';

export { DOMAIN_EVENT_VERSION, createDomainEvent, type DomainEvent } from './event/domain-event.js';
export { EVENT_TYPES, type EventType } from './event/event-types.js';
export { InProcessEventBus, type EventBus, type EventHandler } from './event/event-bus.js';

export {
  type ResourceRepository,
  type ResourceListFilter,
  type ResourceListResult,
} from './repository/resource-repository.js';
export { type ContextRepository } from './repository/context-repository.js';

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
