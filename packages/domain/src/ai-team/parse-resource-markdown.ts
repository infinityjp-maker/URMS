export type ParsedResourceMarkdown = {
  resourceType: string;
  resourceId: string;
  name: string;
  sourcePath: string;
  contentHash: string;
};

const RESOURCE_ID_PATTERN = /\*\*resource_id:\*\*\s*([^\s\r\n]+)/;
const RESOURCE_TYPE_PATTERN = /\*\*resource_type:\*\*\s*([^\s\r\n]+)/;
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

/** AI Team 正本 Markdown から resource_type / resource_id を抽出 */
export function parseResourceMarkdown(
  content: string,
  sourcePath: string,
  fallbackName: string,
): ParsedResourceMarkdown | null {
  const refRaw = content.match(RESOURCE_ID_PATTERN)?.[1];
  if (!refRaw) {
    return null;
  }

  const ref = splitResourceRef(refRaw);
  if (!ref) {
    return null;
  }

  const explicitType = content.match(RESOURCE_TYPE_PATTERN)?.[1]?.trim();
  const resourceType = explicitType || ref.resourceType;

  return {
    resourceType,
    resourceId: ref.resourceId,
    name: parseTitle(content, fallbackName),
    sourcePath,
    contentHash: hashContent(content),
  };
}

function hashContent(content: string): string {
  let hash = 0;
  for (let index = 0; index < content.length; index += 1) {
    hash = (hash * 31 + content.charCodeAt(index)) >>> 0;
  }
  return hash.toString(16);
}
