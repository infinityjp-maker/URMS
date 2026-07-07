const TITLE_PATTERN = /^#\s+(.+)$/m;

/** Resource.name を正本 Markdown の H1 に反映（本文は不変） */
export function updateMarkdownTitle(content: string, title: string): string | null {
  const trimmedTitle = title.trim();
  if (!trimmedTitle) {
    return null;
  }

  const match = content.match(TITLE_PATTERN);
  if (!match) {
    return null;
  }

  const currentTitle = match[1]?.trim() ?? '';
  if (currentTitle === trimmedTitle) {
    return null;
  }

  return content.replace(TITLE_PATTERN, `# ${trimmedTitle}`);
}
