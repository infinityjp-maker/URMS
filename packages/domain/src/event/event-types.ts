export const EVENT_TYPES = {
  ResourceCreated: 'ResourceCreated',
  ResourceUpdated: 'ResourceUpdated',
  ResourceLifecycleChanged: 'ResourceLifecycleChanged',
  ResourceArchived: 'ResourceArchived',
  ContextUpdated: 'ContextUpdated',
  ModeChanged: 'ModeChanged',
} as const;

export type EventType = (typeof EVENT_TYPES)[keyof typeof EVENT_TYPES];
