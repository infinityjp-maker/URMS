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

  it('keeps @urms/domain/perception browser chain free of shared barrel and node imports', () => {
    const domainDist = path.resolve(SRC_ROOT, '../../../packages/domain/dist');
    const chainFiles = [
      'perception/index.js',
      'perception/build-perception-state.js',
      'perception/build-perception-meta.js',
      'perception/synthesize-loop-continuity.js',
      'perception/synthesize-context-note.js',
      'perception/resolve-perception-status-line.js',
      'perception/day-phase.js',
      'perception/fixtures.js',
      'perception/graph/relation-graph-signal.js',
      'context/context-defaults.js',
      'context/advance-context-task.js',
    ];
    const violations: string[] = [];

    for (const relative of chainFiles) {
      const filePath = path.join(domainDist, relative);
      const content = readFileSync(filePath, 'utf8');
      if (/from ['"]@urms\/shared['"]/.test(content)) {
        violations.push(`${relative}: imports @urms/shared barrel`);
      }
      if (/from ['"]node:/.test(content)) {
        violations.push(`${relative}: imports node built-in`);
      }
    }

    expect(violations).toEqual([]);
  });
});
