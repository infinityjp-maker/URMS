const HEADING_PATTERN = /^##\s+(.+)$/m;

export type MarkdownLinkItem = {
  label: string;
  path: string;
};

function findSectionBounds(content: string, sectionHeading: string): { start: number; end: number } | null {
  const headingRegex = new RegExp(`^##\\s+${escapeRegex(sectionHeading)}\\s*$`, 'm');
  const match = headingRegex.exec(content);
  if (!match || match.index === undefined) {
    return null;
  }

  const start = match.index + match[0].length;
  const rest = content.slice(start);
  const nextHeading = rest.search(/^##\s+/m);
  const end = nextHeading === -1 ? content.length : start + nextHeading;

  return { start, end };
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** `## Section` 直下の最初の `**bold**` 行を summary に差し替え */
export function updateMarkdownSectionBoldLine(
  content: string,
  sectionHeading: string,
  summary: string,
): string | null {
  const trimmedSummary = summary.trim();
  if (!trimmedSummary) {
    return null;
  }

  const bounds = findSectionBounds(content, sectionHeading);
  if (!bounds) {
    return null;
  }

  const section = content.slice(bounds.start, bounds.end);
  const boldPattern = /\*\*[^*]+\*\*/;
  const nextBold = `**${trimmedSummary}**`;

  if (!boldPattern.test(section)) {
    const insertion = `\n\n${nextBold}\n`;
    return `${content.slice(0, bounds.start)}${insertion}${content.slice(bounds.end)}`;
  }

  const updatedSection = section.replace(boldPattern, nextBold);
  if (updatedSection === section) {
    return null;
  }

  return `${content.slice(0, bounds.start)}${updatedSection}${content.slice(bounds.end)}`;
}

/** `## Section` 内テーブル行 `| rowLabel | value |` の value セルを更新 */
export function updateMarkdownTableCell(
  content: string,
  sectionHeading: string,
  rowLabel: string,
  cellValue: string,
): string | null {
  const trimmedValue = cellValue.trim();
  if (!trimmedValue) {
    return null;
  }

  const bounds = findSectionBounds(content, sectionHeading);
  if (!bounds) {
    return null;
  }

  const section = content.slice(bounds.start, bounds.end);
  const rowPattern = new RegExp(`(\\|\\s*${escapeRegex(rowLabel)}\\s*\\|\\s*)(\\*\\*)?([^|]*?(\\*\\*)?)(\\s*\\|)`, 'm');
  const match = rowPattern.exec(section);
  if (!match) {
    return null;
  }

  const nextCell = `**${trimmedValue}**`;
  const currentCell = match[3]?.replace(/\*\*/g, '').trim() ?? '';
  if (currentCell === trimmedValue) {
    return null;
  }

  const updatedSection = section.replace(rowPattern, `$1${nextCell}$5`);
  return `${content.slice(0, bounds.start)}${updatedSection}${content.slice(bounds.end)}`;
}

/** `## Section` 内の先頭 bullet リストを SSOT リンクに差し替え */
export function updateMarkdownSectionBulletLinks(
  content: string,
  sectionHeading: string,
  links: readonly MarkdownLinkItem[],
): string | null {
  if (links.length === 0) {
    return null;
  }

  const bounds = findSectionBounds(content, sectionHeading);
  if (!bounds) {
    return null;
  }

  const section = content.slice(bounds.start, bounds.end);
  const bulletBlock = links.map((link) => `- [${link.label}](${link.path})`).join('\n');
  const bulletPattern = /(?:\r?\n)- \[[^\]]+\]\([^)]+\)(?:\r?\n- \[[^\]]+\]\([^)]+\))*/;
  const match = bulletPattern.exec(section);

  if (!match) {
    const insertion = `\n\n${bulletBlock}\n`;
    return `${content.slice(0, bounds.start)}${insertion}${content.slice(bounds.end)}`;
  }

  const nextBlock = `\n${bulletBlock}`;
  if (match[0] === nextBlock) {
    return null;
  }

  const updatedSection = `${section.slice(0, match.index)}${nextBlock}${section.slice(match.index + match[0].length)}`;
  return `${content.slice(0, bounds.start)}${updatedSection}${content.slice(bounds.end)}`;
}

export function hasMarkdownHeading(content: string, sectionHeading: string): boolean {
  return HEADING_PATTERN.test(content) && findSectionBounds(content, sectionHeading) !== null;
}
