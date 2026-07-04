import { describe, expect, it } from 'vitest';

import { ERROR_CODES } from '@urms/shared';

import {
  assertValidTransition,
  canTransition,
  getAllowedTransitions,
} from './lifecycle.js';

describe('Resource lifecycle', () => {
  it('allows draft → active and draft → archived', () => {
    expect(canTransition('draft', 'active')).toBe(true);
    expect(canTransition('draft', 'archived')).toBe(true);
  });

  it('allows active → deprecated and active → archived', () => {
    expect(canTransition('active', 'deprecated')).toBe(true);
    expect(canTransition('active', 'archived')).toBe(true);
  });

  it('rejects draft → deprecated', () => {
    expect(canTransition('draft', 'deprecated')).toBe(false);
  });

  it('rejects transitions from archived', () => {
    expect(getAllowedTransitions('archived')).toEqual([]);
    expect(canTransition('archived', 'active')).toBe(false);
  });

  it('throws AppError on invalid transition', () => {
    expect(() => assertValidTransition('deprecated', 'active')).toThrowError(
      expect.objectContaining({ code: ERROR_CODES.RESOURCE_INVALID_LIFECYCLE }),
    );
  });
});
