import { describe, expect, it } from 'vitest';

import {
  updateMarkdownSectionBoldLine,
  updateMarkdownSectionBulletLinks,
  updateMarkdownTableCell,
} from './update-context-markdown-section.js';

describe('updateMarkdownSectionBoldLine', () => {
  it('updates bold line under section heading', () => {
    const content = '# Title\n\n## Task\n\n**Old task**\n\nDetails\n\n## Next\n';
    expect(updateMarkdownSectionBoldLine(content, 'Task', 'New task')).toBe(
      '# Title\n\n## Task\n\n**New task**\n\nDetails\n\n## Next\n',
    );
  });

  it('returns null when summary matches', () => {
    const content = '## Task\n\n**Same**\n';
    expect(updateMarkdownSectionBoldLine(content, 'Task', 'Same')).toBeNull();
  });
});

describe('updateMarkdownTableCell', () => {
  it('updates table cell in section', () => {
    const content = '## サマリ\n\n| 項目 | 値 |\n| 状態 | **Old** |\n';
    expect(updateMarkdownTableCell(content, 'サマリ', '状態', 'New status')).toContain('| 状態 | **New status** |');
  });
});

describe('updateMarkdownSectionBulletLinks', () => {
  it('replaces bullet links in section', () => {
    const content = '## リンク\n\n- [Old](old.md)\n\n## Next\n';
    const next = updateMarkdownSectionBulletLinks(content, 'リンク', [
      { label: 'New', path: 'new.md' },
    ]);
    expect(next).toContain('- [New](new.md)');
    expect(next).not.toContain('[Old](old.md)');
  });
});
