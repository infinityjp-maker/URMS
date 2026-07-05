import {
  AppError,
  CONTEXT_SUMMARY_MAX_LENGTH,
  EDITABLE_CONTEXT_KEYS,
  ERROR_CODES,
  type ContextKey,
  type ContextUpdateItem,
  type SsotLink,
} from '@urms/shared';

const ALLOWED_SSOT_PREFIXES = ['/docs/', '/v1/knowledge/'] as const;

export function assertEditableContextKey(key: ContextKey): void {
  if (!(EDITABLE_CONTEXT_KEYS as readonly string[]).includes(key)) {
    throw new AppError(
      ERROR_CODES.VALIDATION_REQUIRED_FIELD,
      `Context key is not editable: ${key}`,
      [{ field: 'key', message: 'Key is system-managed or invalid' }],
    );
  }
}

export function validateContextUpdateItems(items: ContextUpdateItem[]): void {
  if (items.length === 0) {
    throw new AppError(ERROR_CODES.VALIDATION_REQUIRED_FIELD, 'At least one context item is required');
  }

  for (const item of items) {
    assertEditableContextKey(item.key);
    validateSummary(item.summary);
    validateSsotLinks(item.ssotLinks ?? []);
  }
}

export function validateSummary(summary: string): void {
  const trimmed = summary.trim();

  if (!trimmed) {
    throw new AppError(ERROR_CODES.VALIDATION_REQUIRED_FIELD, 'summary is required', [
      { field: 'summary', message: 'summary is required' },
    ]);
  }

  if (trimmed.length > CONTEXT_SUMMARY_MAX_LENGTH) {
    throw new AppError(
      ERROR_CODES.VALIDATION_REQUIRED_FIELD,
      `summary must be at most ${CONTEXT_SUMMARY_MAX_LENGTH} characters`,
      [{ field: 'summary', message: `Maximum ${CONTEXT_SUMMARY_MAX_LENGTH} characters` }],
    );
  }

  if (/^##\s/m.test(trimmed) || trimmed.includes('\n## ')) {
    throw new AppError(
      ERROR_CODES.VALIDATION_REQUIRED_FIELD,
      'summary must not contain Markdown headings',
      [{ field: 'summary', message: 'Markdown body patterns are not allowed' }],
    );
  }
}

export function validateSsotLinks(links: SsotLink[]): void {
  for (const link of links) {
    if (!link.label?.trim()) {
      throw new AppError(ERROR_CODES.VALIDATION_REQUIRED_FIELD, 'ssotLinks.label is required', [
        { field: 'ssotLinks.label', message: 'label is required' },
      ]);
    }

    if (!link.path?.trim()) {
      throw new AppError(ERROR_CODES.VALIDATION_REQUIRED_FIELD, 'ssotLinks.path is required', [
        { field: 'ssotLinks.path', message: 'path is required' },
      ]);
    }

    const allowed = ALLOWED_SSOT_PREFIXES.some((prefix) => link.path.startsWith(prefix));
    if (!allowed) {
      throw new AppError(
        ERROR_CODES.VALIDATION_REQUIRED_FIELD,
        `Invalid ssotLinks.path prefix: ${link.path}`,
        [{ field: 'ssotLinks.path', message: 'Path must start with /docs/ or /v1/knowledge/' }],
      );
    }
  }
}
