import { describe, expect, it } from 'vitest';

import {
  parseUrmsExportSummary,
  updateUrmsExportSection,
} from './update-resource-markdown-urms-section.js';

describe('updateUrmsExportSection', () => {
  it('appends URMS Export block when missing', () => {
    const content = '# Title\n\nBody\n';
    expect(updateUrmsExportSection(content, 'Exported summary')).toContain('## URMS Export');
    expect(updateUrmsExportSection(content, 'Exported summary')).toContain('**Summary:** Exported summary');
  });

  it('updates existing URMS Export summary', () => {
    const content = '# Title\n\n## URMS Export\n\n**Summary:** Old\n\n## Next\n';
    expect(updateUrmsExportSection(content, 'New')).toContain('**Summary:** New');
    expect(updateUrmsExportSection(content, 'New')).not.toContain('**Summary:** Old');
  });

  it('updates Status and Owner lines in URMS Export block', () => {
    const content = '# Title\n\n## URMS Export\n\n**Summary:** Old\n\n## Next\n';
    const updated = updateUrmsExportSection(content, {
      summary: 'New',
      status: 'doing',
      owner: 'PM',
    });
    expect(updated).toContain('**Summary:** New');
    expect(updated).toContain('**Status:** doing');
    expect(updated).toContain('**Owner:** PM');
  });

  it('preserves Status and Owner lines when metadata omits them', () => {
    const content =
      '# Title\n\n## URMS Export\n\n**Summary:** Same\n**Status:** local\n**Owner:** user\n\n## Next\n';
    expect(updateUrmsExportSection(content, 'Same')).toBeNull();
    expect(content).toContain('**Status:** local');
  });

  it('returns null when summary matches', () => {
    const content = '# Title\n\n## URMS Export\n\n**Summary:** Same\n';
    expect(updateUrmsExportSection(content, 'Same')).toBeNull();
  });
});

describe('parseUrmsExportSummary', () => {
  it('reads summary from URMS Export block', () => {
    const content = '## URMS Export\n\n**Summary:** From file\n';
    expect(parseUrmsExportSummary(content)).toBe('From file');
  });
});
