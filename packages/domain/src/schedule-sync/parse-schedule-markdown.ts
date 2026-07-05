export type ParsedScheduleMarkdown = {
  resourceType: 'schedule';
  resourceId: string;
  name: string;
  sourcePath: string;
  contentHash: string;
  metadata: {
    startAt?: string;
    recurrence?: 'daily';
    time?: string;
    timezone?: string;
    tone?: string;
    note?: string;
  };
};

const RESOURCE_ID_PATTERN = /\*\*resource_id:\*\*\s*([^\s\r\n]+)/;
const RESOURCE_TYPE_PATTERN = /\*\*resource_type:\*\*\s*([^\s\r\n]+)/;
const START_AT_PATTERN = /\*\*startAt:\*\*\s*([^\s\r\n]+)/;
const RECURRENCE_PATTERN = /\*\*recurrence:\*\*\s*([^\s\r\n]+)/;
const TIME_PATTERN = /\*\*time:\*\*\s*([^\s\r\n]+)/;
const TIMEZONE_PATTERN = /\*\*timezone:\*\*\s*([^\s\r\n]+)/;
const TONE_PATTERN = /\*\*tone:\*\*\s*([^\s\r\n]+)/;
const TITLE_PATTERN = /^#\s+(.+)$/m;

function parseTitle(content: string, fallback: string): string {
  const match = content.match(TITLE_PATTERN);
  return match?.[1]?.trim() || fallback;
}

function splitResourceRef(raw: string): { resourceType: string; resourceId: string } | null {
  const trimmed = raw.trim();
  const colon = trimmed.indexOf(':');
  if (colon <= 0 || colon === trimmed.length - 1) {
    return null;
  }

  return {
    resourceType: trimmed.slice(0, colon),
    resourceId: trimmed.slice(colon + 1),
  };
}

function parseBodyNote(content: string): string | undefined {
  const lines = content.split(/\r?\n/);
  let bodyStart = 0;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]?.trim() ?? '';
    if (line.startsWith('#')) {
      bodyStart = index + 1;
      break;
    }
  }

  const body = lines
    .slice(bodyStart)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('>'))
    .join(' ')
    .trim();

  return body.length > 0 ? body : undefined;
}

/** `.cursor/resources/schedule/*.md` — schedule Resource 正本 */
export function parseScheduleMarkdown(
  content: string,
  sourcePath: string,
  fallbackName: string,
): ParsedScheduleMarkdown | null {
  const refRaw = content.match(RESOURCE_ID_PATTERN)?.[1];
  if (!refRaw) {
    return null;
  }

  const ref = splitResourceRef(refRaw);
  if (!ref || ref.resourceType !== 'schedule') {
    return null;
  }

  const explicitType = content.match(RESOURCE_TYPE_PATTERN)?.[1]?.trim();
  if (explicitType && explicitType !== 'schedule') {
    return null;
  }

  const recurrenceRaw = content.match(RECURRENCE_PATTERN)?.[1]?.trim();
  const recurrence = recurrenceRaw === 'daily' ? 'daily' : undefined;
  const startAt = content.match(START_AT_PATTERN)?.[1]?.trim();
  const time = content.match(TIME_PATTERN)?.[1]?.trim();
  const timezone = content.match(TIMEZONE_PATTERN)?.[1]?.trim();
  const tone = content.match(TONE_PATTERN)?.[1]?.trim();
  const note = parseBodyNote(content);

  if (!startAt && !(recurrence === 'daily' && time)) {
    return null;
  }

  return {
    resourceType: 'schedule',
    resourceId: ref.resourceId,
    name: parseTitle(content, fallbackName),
    sourcePath,
    contentHash: hashContent(content),
    metadata: {
      ...(startAt ? { startAt } : {}),
      ...(recurrence ? { recurrence } : {}),
      ...(time ? { time } : {}),
      ...(timezone ? { timezone } : {}),
      ...(tone ? { tone } : {}),
      ...(note ? { note } : {}),
    },
  };
}

function hashContent(content: string): string {
  let hash = 0;
  for (let index = 0; index < content.length; index += 1) {
    hash = (hash * 31 + content.charCodeAt(index)) >>> 0;
  }
  return hash.toString(16);
}
