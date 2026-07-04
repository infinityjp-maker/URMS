import { AppError, ERROR_CODES, type ResourceStatus } from '@urms/shared';

const ALLOWED_TRANSITIONS: Record<ResourceStatus, readonly ResourceStatus[]> = {
  draft: ['active', 'archived'],
  active: ['deprecated', 'archived'],
  deprecated: ['archived'],
  archived: [],
};

export function canTransition(from: ResourceStatus, to: ResourceStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function assertValidTransition(from: ResourceStatus, to: ResourceStatus): void {
  if (!canTransition(from, to)) {
    throw new AppError(
      ERROR_CODES.RESOURCE_INVALID_LIFECYCLE,
      `Invalid lifecycle transition: ${from} → ${to}`,
    );
  }
}

export function getAllowedTransitions(from: ResourceStatus): readonly ResourceStatus[] {
  return ALLOWED_TRANSITIONS[from];
}
