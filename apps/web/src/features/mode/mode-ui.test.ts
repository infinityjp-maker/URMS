import { describe, expect, it } from 'vitest';

import {
  canShowAuditNav,
  canShowIntegrationsNav,
  canShowResourceWrite,
  getModeLabel,
} from './mode-ui.js';

describe('mode-ui', () => {
  it('shows resource write in operate and develop', () => {
    expect(canShowResourceWrite('operate')).toBe(true);
    expect(canShowResourceWrite('develop')).toBe(true);
    expect(canShowResourceWrite('plan')).toBe(false);
    expect(canShowResourceWrite('audit')).toBe(false);
  });

  it('shows audit nav in audit and develop modes', () => {
    expect(canShowAuditNav('audit')).toBe(true);
    expect(canShowAuditNav('develop')).toBe(true);
    expect(canShowAuditNav('operate')).toBe(false);
  });

  it('shows integrations nav only in develop mode', () => {
    expect(canShowIntegrationsNav('develop')).toBe(true);
    expect(canShowIntegrationsNav('operate')).toBe(false);
  });

  it('labels develop mode in Japanese', () => {
    expect(getModeLabel('develop')).toBe('開発');
  });
});
