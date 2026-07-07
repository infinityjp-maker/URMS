import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const SRC_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function collectSourceFiles(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return collectSourceFiles(fullPath);
    }

    if (!/\.(ts|tsx)$/.test(entry.name) || entry.name.endsWith('.test.ts')) {
      return [];
    }

    return [fullPath];
  });
}

function findViolations(content: string, filePath: string): string[] {
  const violations: string[] = [];
  const lines = content.split(/\r?\n/);

  for (const [index, line] of lines.entries()) {
    const trimmed = line.trim();
    if (trimmed.startsWith('import type ')) {
      continue;
    }

    if (/from ['"]@urms\/domain['"]/.test(trimmed)) {
      violations.push(`${filePath}:${index + 1} imports @urms/domain root`);
    }

    if (/from ['"]@urms\/shared['"]/.test(trimmed)) {
      violations.push(`${filePath}:${index + 1} value-imports @urms/shared barrel`);
    }
  }

  return violations;
}

describe('browser-safe imports', () => {
  it('avoids Node-only package barrels in desktop client code', () => {
    const violations = collectSourceFiles(SRC_ROOT).flatMap((filePath) =>
      findViolations(readFileSync(filePath, 'utf8'), path.relative(SRC_ROOT, filePath)),
    );

    expect(violations).toEqual([]);
  });
});
