const URMS_EXPORT_HEADING = '## URMS Export';
const SUMMARY_PATTERN = /\*\*Summary:\*\*\s*(.+?)(?:\r?\n|$)/;
const STATUS_PATTERN = /\*\*Status:\*\*\s*(.+?)(?:\r?\n|$)/;
const OWNER_PATTERN = /\*\*Owner:\*\*\s*(.+?)(?:\r?\n|$)/;

export type UrmsExportFields = {
  summary: string;
  status?: string;
  owner?: string;
};

function normalizeFields(payload: UrmsExportFields | string): UrmsExportFields {
  if (typeof payload === 'string') {
    return { summary: payload };
  }
  return payload;
}

/** `## URMS Export` 内の Status / Owner を抽出（書き戻し時の手編集行を保持） */
export function parseUrmsExportStatus(content: string): string | null {
  const section = readUrmsExportSection(content);
  if (!section) {
    return null;
  }
  return STATUS_PATTERN.exec(section)?.[1]?.trim() ?? null;
}

export function parseUrmsExportOwner(content: string): string | null {
  const section = readUrmsExportSection(content);
  if (!section) {
    return null;
  }
  return OWNER_PATTERN.exec(section)?.[1]?.trim() ?? null;
}

function buildUrmsExportBlock(fields: UrmsExportFields): string {
  const lines = [
    URMS_EXPORT_HEADING,
    '',
    '> Auto-managed by cursor-local export.',
    '',
    `**Summary:** ${fields.summary.trim()}`,
  ];

  if (fields.status?.trim()) {
    lines.push(`**Status:** ${fields.status.trim()}`);
  }
  if (fields.owner?.trim()) {
    lines.push(`**Owner:** ${fields.owner.trim()}`);
  }

  return `${lines.join('\n')}\n`;
}

function readUrmsExportSection(content: string): string {
  const headingIndex = content.indexOf(URMS_EXPORT_HEADING);
  if (headingIndex === -1) {
    return '';
  }

  const sectionStart = headingIndex + URMS_EXPORT_HEADING.length;
  const rest = content.slice(sectionStart);
  const nextHeading = rest.search(/^##\s+/m);
  return nextHeading === -1 ? rest : rest.slice(0, nextHeading);
}

/** `## URMS Export` 内の Summary 行を抽出 */
export function parseUrmsExportSummary(content: string): string | null {
  const section = readUrmsExportSection(content);
  if (!section) {
    return null;
  }

  const match = SUMMARY_PATTERN.exec(section);
  return match?.[1]?.trim() ?? null;
}

function fieldsMatchSection(fields: UrmsExportFields, section: string): boolean {
  const summary = SUMMARY_PATTERN.exec(section)?.[1]?.trim() ?? '';
  const status = STATUS_PATTERN.exec(section)?.[1]?.trim() ?? '';
  const owner = OWNER_PATTERN.exec(section)?.[1]?.trim() ?? '';

  return (
    summary === fields.summary.trim() &&
    status === (fields.status?.trim() ?? '') &&
    owner === (fields.owner?.trim() ?? '')
  );
}

/** Resource 要約を `## URMS Export` に書戻し（本文 merge 用の限定ゾーン） */
export function updateUrmsExportSection(content: string, payload: UrmsExportFields | string): string | null {
  const incoming = normalizeFields(payload);
  if (!incoming.summary.trim()) {
    return null;
  }

  const fields: UrmsExportFields = {
    summary: incoming.summary.trim(),
    status: incoming.status?.trim() ?? parseUrmsExportStatus(content) ?? undefined,
    owner: incoming.owner?.trim() ?? parseUrmsExportOwner(content) ?? undefined,
  };

  const block = buildUrmsExportBlock(fields);
  const section = readUrmsExportSection(content);
  if (section && fieldsMatchSection(fields, section)) {
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
