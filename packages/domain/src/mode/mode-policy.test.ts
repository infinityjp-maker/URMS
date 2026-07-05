import { describe, expect, it } from 'vitest';

import { ERROR_CODES } from '@urms/shared';

import { assertModeAllowed, modePolicy } from './mode-policy.js';

describe('ModePolicy', () => {
  it('allows read in all modes', () => {
    expect(modePolicy.canReadResource('plan')).toBe(true);
    expect(modePolicy.canReadResource('operate')).toBe(true);
    expect(modePolicy.canReadResource('audit')).toBe(true);
  });

  it('allows write in operate and develop', () => {
    expect(modePolicy.canWriteResource('operate')).toBe(true);
    expect(modePolicy.canWriteResource('develop')).toBe(true);
    expect(modePolicy.canWriteResource('plan')).toBe(false);
  });

  it('allows context read in plan, operate, and develop', () => {
    expect(modePolicy.canReadContext('plan')).toBe(true);
    expect(modePolicy.canReadContext('operate')).toBe(true);
    expect(modePolicy.canReadContext('develop')).toBe(true);
    expect(modePolicy.canReadContext('audit')).toBe(false);
  });

  it('allows context update in plan and develop', () => {
    expect(modePolicy.canUpdateContext('plan')).toBe(true);
    expect(modePolicy.canUpdateContext('develop')).toBe(true);
    expect(modePolicy.canUpdateContext('operate')).toBe(false);
  });

  it('allows integration sync only in develop', () => {
    expect(modePolicy.canSyncIntegrations('develop')).toBe(true);
    expect(modePolicy.canSyncIntegrations('operate')).toBe(false);
  });

  it('allows audit view in audit and develop modes', () => {
    expect(modePolicy.canViewAudit('audit')).toBe(true);
    expect(modePolicy.canViewAudit('develop')).toBe(true);
    expect(modePolicy.canViewAudit('operate')).toBe(false);
  });

  it('throws MODE_NOT_ALLOWED when assertion fails', () => {
    expect(() => assertModeAllowed(false, 'denied')).toThrowError(
      expect.objectContaining({ code: ERROR_CODES.MODE_NOT_ALLOWED }),
    );
  });
});
