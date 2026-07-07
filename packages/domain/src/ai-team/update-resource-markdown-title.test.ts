import { describe, expect, it } from 'vitest';

import { updateMarkdownTitle } from './update-resource-markdown-title.js';

describe('updateMarkdownTitle', () => {
  it('updates the first H1 when title differs', () => {
    const content = '# Old Title\n\n**resource_id:** role:pm\n';
    expect(updateMarkdownTitle(content, 'New Title')).toBe('# New Title\n\n**resource_id:** role:pm\n');
  });

  it('returns null when title is unchanged', () => {
    const content = '# Same\n\nbody';
    expect(updateMarkdownTitle(content, 'Same')).toBeNull();
  });

  it('returns null when file has no H1', () => {
    expect(updateMarkdownTitle('no heading', 'Title')).toBeNull();
  });
});
