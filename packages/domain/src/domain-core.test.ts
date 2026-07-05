import { describe, expect, it } from 'vitest';

import { createDomainCore } from './domain-core.js';

describe('createDomainCore', () => {
  it('loads contract manifest and version', () => {
    const core = createDomainCore();

    expect(core.version).toBe('0.2.0-s2');
    expect(core.contract.documentPath).toContain('implementation-contract');
  });
});
