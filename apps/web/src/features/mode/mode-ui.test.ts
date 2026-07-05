import { describe, expect, it } from 'vitest';

import { canShowAuditNav, canShowResourceWrite } from './mode-ui.js';

describe('mode-ui', () => {
  it('shows resource write only in operate', () => {
    expect(canShowResourceWrite('operate')).toBe(true);
    expect(canShowResourceWrite('plan')).toBe(false);
    expect(canShowResourceWrite('audit')).toBe(false);
  });

  it('shows audit nav only in audit mode', () => {
    expect(canShowAuditNav('audit')).toBe(true);
    expect(canShowAuditNav('operate')).toBe(false);
  });
});
