import { describe, expect, it } from 'vitest';

import { canShowIntegrationsNav, getModeLabel } from './mode-ui.js';

describe('mode-ui', () => {
  it('shows integrations only in develop mode', () => {
    expect(canShowIntegrationsNav('develop')).toBe(true);
    expect(canShowIntegrationsNav('operate')).toBe(false);
  });

  it('labels develop mode in Japanese', () => {
    expect(getModeLabel('develop')).toBe('開発');
  });
});
