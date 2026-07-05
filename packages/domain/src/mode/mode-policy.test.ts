import { describe, expect, it } from 'vitest';

import { ERROR_CODES } from '@urms/shared';

import { assertModeAllowed, modePolicy } from './mode-policy.js';

describe('ModePolicy', () => {
  it('allows read in all modes', () => {
    expect(modePolicy.canReadResource('plan')).toBe(true);
    expect(modePolicy.canReadResource('operate')).toBe(true);
    expect(modePolicy.canReadResource('audit')).toBe(true);
  });

  it('allows write only in operate', () => {
    expect(modePolicy.canWriteResource('operate')).toBe(true);
    expect(modePolicy.canWriteResource('plan')).toBe(false);
    expect(modePolicy.canWriteResource('audit')).toBe(false);
  });

  it('allows context read in plan and operate', () => {
    expect(modePolicy.canReadContext('plan')).toBe(true);
    expect(modePolicy.canReadContext('operate')).toBe(true);
    expect(modePolicy.canReadContext('audit')).toBe(false);
  });

  it('allows context update only in plan', () => {
    expect(modePolicy.canUpdateContext('plan')).toBe(true);
    expect(modePolicy.canUpdateContext('operate')).toBe(false);
  });

  it('allows audit view only in audit mode', () => {
    expect(modePolicy.canViewAudit('audit')).toBe(true);
    expect(modePolicy.canViewAudit('operate')).toBe(false);
  });

  it('throws MODE_NOT_ALLOWED when assertion fails', () => {
    expect(() => assertModeAllowed(false, 'denied')).toThrowError(
      expect.objectContaining({ code: ERROR_CODES.MODE_NOT_ALLOWED }),
    );
  });
});
