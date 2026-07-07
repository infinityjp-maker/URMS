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
