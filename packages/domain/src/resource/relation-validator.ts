import { AppError, ERROR_CODES, RESOURCE_RELATION_TYPES, type ResourceRelationEntity } from '@urms/shared';

const RELATION_TYPE_PATTERN = /^[a-z][a-z0-9]*(_[a-z0-9]+)*$/;

export function assertValidRelationType(value: string): string {
  const normalized = value.trim();
  if (!RELATION_TYPE_PATTERN.test(normalized)) {
    throw new AppError(
      ERROR_CODES.RELATION_INVALID,
      'relationType must be snake_case (e.g. depends_on, provided_by)',
    );
  }

  if (!(RESOURCE_RELATION_TYPES as readonly string[]).includes(normalized)) {
    throw new AppError(
      ERROR_CODES.RELATION_INVALID,
      `Unsupported relationType: ${normalized}. Allowed: ${RESOURCE_RELATION_TYPES.join(', ')}`,
    );
  }

  return normalized;
}

export function validateRelationEndpoints(input: {
  fromType?: string;
  fromId?: string;
  toType?: string;
  toId?: string;
  relationType?: string;
}): void {
  const details = [];

  if (!input.fromType?.trim()) details.push({ field: 'fromType', message: 'fromType is required' });
  if (!input.fromId?.trim()) details.push({ field: 'fromId', message: 'fromId is required' });
  if (!input.toType?.trim()) details.push({ field: 'toType', message: 'toType is required' });
  if (!input.toId?.trim()) details.push({ field: 'toId', message: 'toId is required' });
  if (!input.relationType?.trim()) details.push({ field: 'relationType', message: 'relationType is required' });

  if (details.length > 0) {
    throw new AppError(ERROR_CODES.VALIDATION_REQUIRED_FIELD, 'Validation failed', details);
  }

  if (
    input.fromType?.trim() === input.toType?.trim() &&
    input.fromId?.trim() === input.toId?.trim()
  ) {
    throw new AppError(ERROR_CODES.RELATION_INVALID, 'Cannot relate a resource to itself');
  }

  assertValidRelationType(input.relationType ?? '');
}

export function isRelationPayload(payload: Record<string, unknown>): payload is { relation: ResourceRelationEntity } {
  const relation = payload.relation;
  return Boolean(relation && typeof relation === 'object' && 'id' in relation);
}
