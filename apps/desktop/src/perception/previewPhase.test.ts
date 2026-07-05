import { describe, expect, it } from 'vitest';

import { parsePreviewPhase, previewPhaseHref, resolveDisplayPhase } from './previewPhase.js';

describe('previewPhase', () => {
  it('returns null without query', () => {
    expect(parsePreviewPhase('')).toBeNull();
    expect(parsePreviewPhase('?foo=bar')).toBeNull();
  });

  it('parses valid phase query in dev builds', () => {
    if (!import.meta.env.DEV) {
      expect(parsePreviewPhase('?phase=day')).toBeNull();
      return;
    }
    expect(parsePreviewPhase('?phase=day')).toBe('day');
    expect(parsePreviewPhase('?phase=invalid')).toBeNull();
  });

  it('falls back to actual phase when preview inactive', () => {
    expect(resolveDisplayPhase('night', '')).toBe('night');
  });

  it('builds preview hrefs', () => {
    expect(previewPhaseHref('morning')).toBe('?phase=morning');
  });
});
