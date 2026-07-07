export type ParsedLocationMarkdown = {
  resourceType: 'location';
  resourceId: string;
  name: string;
  sourcePath: string;
  contentHash: string;
  metadata: {
    latitude: number;
    longitude: number;
    timezone?: string;
    primary?: boolean;
    placeName?: string;
  };
};

const RESOURCE_ID_PATTERN = /\*\*resource_id:\*\*\s*([^\s\r\n]+)/;
const RESOURCE_TYPE_PATTERN = /\*\*resource_type:\*\*\s*([^\s\r\n]+)/;
const LATITUDE_PATTERN = /\*\*latitude:\*\*\s*([^\s\r\n]+)/;
const LONGITUDE_PATTERN = /\*\*longitude:\*\*\s*([^\s\r\n]+)/;
const TIMEZONE_PATTERN = /\*\*timezone:\*\*\s*([^\s\r\n]+)/;
const PRIMARY_PATTERN = /\*\*primary:\*\*\s*([^\s\r\n]+)/;
const PLACE_NAME_PATTERN = /\*\*place_name:\*\*\s*([^\r\n]+)/;
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

function parseCoordinate(value: string | undefined): number | null {
  if (!value?.trim()) return null;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/** `.cursor/resources/location/*.md` — location Resource 正本（天気 SSOT） */
export function parseLocationMarkdown(
  content: string,
  sourcePath: string,
  fallbackName: string,
): ParsedLocationMarkdown | null {
  const refRaw = content.match(RESOURCE_ID_PATTERN)?.[1];
  if (!refRaw) {
    return null;
  }

  const ref = splitResourceRef(refRaw);
  if (!ref || ref.resourceType !== 'location') {
    return null;
  }

  const explicitType = content.match(RESOURCE_TYPE_PATTERN)?.[1]?.trim();
  if (explicitType && explicitType !== 'location') {
    return null;
  }

  const latitude = parseCoordinate(content.match(LATITUDE_PATTERN)?.[1]);
  const longitude = parseCoordinate(content.match(LONGITUDE_PATTERN)?.[1]);
  if (latitude === null || longitude === null) {
    return null;
  }

  const timezone = content.match(TIMEZONE_PATTERN)?.[1]?.trim();
  const primaryRaw = content.match(PRIMARY_PATTERN)?.[1]?.trim().toLowerCase();
  const placeName = content.match(PLACE_NAME_PATTERN)?.[1]?.trim();

  return {
    resourceType: 'location',
    resourceId: ref.resourceId,
    name: parseTitle(content, fallbackName),
    sourcePath,
    contentHash: hashContent(content),
    metadata: {
      latitude,
      longitude,
      ...(timezone ? { timezone } : {}),
      ...(primaryRaw === 'true' ? { primary: true } : {}),
      ...(placeName ? { placeName } : {}),
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
