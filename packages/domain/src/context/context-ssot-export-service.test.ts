import { mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import type { ContextSnapshotItem } from '@urms/shared';

import type { ContextRepository } from '../repository/context-repository.js';
import { createContextSsotExportService } from './context-ssot-export-service.js';

function createRepository(items: ContextSnapshotItem[]): ContextRepository {
  return {
    findAll: async () => items,
    upsert: async (item) => item,
    findByKey: async (key) => items.find((item) => item.key === key) ?? null,
  };
}

describe('ContextSsotExportService', () => {
  it('writes current_task summary into current-task.md Task section', async () => {
    const repoRoot = path.join(os.tmpdir(), `urms-context-export-${Date.now()}`);
    const relativePath = '.cursor/context/current-task.md';
    const absolutePath = path.join(repoRoot, relativePath);
    await mkdir(path.dirname(absolutePath), { recursive: true });
    await writeFile(
      absolutePath,
      '# 現在タスク\n\n## Task\n\n**Old task**\n\nBody\n',
      'utf8',
    );

    const repository = createRepository([
      {
        key: 'current_task',
        summary: 'Exported task summary',
        ssotLinks: [],
        updatedAt: new Date().toISOString(),
        updatedBy: 'developer',
      },
    ]);

    const service = createContextSsotExportService({ repoRoot, contextRepository: repository });
    const report = await service.export('developer', 'develop');

    expect(report.updated).toBeGreaterThanOrEqual(1);
    const content = await readFile(absolutePath, 'utf8');
    expect(content).toContain('**Exported task summary**');
  });
});
