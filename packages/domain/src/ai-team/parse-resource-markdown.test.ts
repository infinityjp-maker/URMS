import { describe, expect, it } from 'vitest';

import { parseResourceMarkdown } from './parse-resource-markdown.js';

describe('parseResourceMarkdown', () => {
  it('parses role markdown frontmatter', () => {
    const parsed = parseResourceMarkdown(
      `# PM\n\n> **resource_type:** role\n> **resource_id:** role:pm\n`,
      'docs/ai-team/01_PM.md',
      'PM',
    );

    expect(parsed).toEqual({
      resourceType: 'role',
      resourceId: 'pm',
      name: 'PM',
      sourcePath: 'docs/ai-team/01_PM.md',
      contentHash: expect.any(String),
    });
  });

  it('parses rule resource_id shorthand', () => {
    const parsed = parseResourceMarkdown(
      `# Rule\n\n> **resource_id:** rule:00-common\n`,
      '.cursor/rules/00_共通ルール.mdc',
      'Rule',
    );

    expect(parsed?.resourceType).toBe('rule');
    expect(parsed?.resourceId).toBe('00-common');
  });

  it('returns null when resource_id is missing', () => {
    expect(parseResourceMarkdown('# No id', 'x.md', 'x')).toBeNull();
  });
});
