const URMS_EXPORT_HEADING = '## URMS Export';
const SUMMARY_PATTERN = /\*\*Summary:\*\*\s*(.+?)(?:\r?\n|$)/;

/** `## URMS Export` 内の Summary 行を抽出 */
export function parseUrmsExportSummary(content: string): string | null {
  const headingIndex = content.indexOf(URMS_EXPORT_HEADING);
  if (headingIndex === -1) {
    return null;
  }

  const sectionStart = headingIndex + URMS_EXPORT_HEADING.length;
  const rest = content.slice(sectionStart);
  const nextHeading = rest.search(/^##\s+/m);
  const section = nextHeading === -1 ? rest : rest.slice(0, nextHeading);
  const match = SUMMARY_PATTERN.exec(section);
  return match?.[1]?.trim() ?? null;
}

/** Resource 要約を `## URMS Export` に書戻し（本文 merge 用の限定ゾーン） */
export function updateUrmsExportSection(content: string, summary: string): string | null {
  const trimmedSummary = summary.trim();
  if (!trimmedSummary) {
    return null;
  }

  const block = `${URMS_EXPORT_HEADING}\n\n> Auto-managed by cursor-local export.\n\n**Summary:** ${trimmedSummary}\n`;
  const existingSummary = parseUrmsExportSummary(content);
  if (existingSummary === trimmedSummary) {
    return null;
  }

  const headingIndex = content.indexOf(URMS_EXPORT_HEADING);

  if (headingIndex === -1) {
    const suffix = content.endsWith('\n') ? '\n' : '\n\n';
    return `${content}${suffix}${block}`;
  }

  const sectionStart = headingIndex + URMS_EXPORT_HEADING.length;
  const rest = content.slice(sectionStart);
  const nextHeading = rest.search(/^##\s+/m);
  const sectionEnd = nextHeading === -1 ? content.length : sectionStart + nextHeading;
  const nextSection = block.trimEnd();

  return `${content.slice(0, headingIndex)}${nextSection}${content.slice(sectionEnd)}`;
}
