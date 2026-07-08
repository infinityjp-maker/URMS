import { describe, expect, it } from 'vitest';

import { formatExportResultMessage } from './export-result-message.js';

describe('formatExportResultMessage', () => {
  it('reports conflict count in plain language', () => {
    expect(formatExportResultMessage({ conflicts: 2 })).toContain('食い違い 2 件');
  });

  it('reports success when no conflicts', () => {
    expect(formatExportResultMessage({ conflicts: 0 })).toBe('書戻し完了');
  });
});
