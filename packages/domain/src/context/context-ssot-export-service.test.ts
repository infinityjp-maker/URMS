import { mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import type { ContextSnapshotItem } from '@urms/shared';

import type { ContextRepository } from '../repository/context-repository.js';
import { createContextSsotExportService } from './context-ssot-export-service.js';

function createRepository(items: ContextSnapshotItem[]): ContextRepository {
  const store = new Map(items.map((item) => [item.key, { ...item }]));

  return {
    findAll: async () => [...store.values()],
    upsert: async (item) => {
      store.set(item.key, item);
      return item;
    },
    findByKey: async (key) => store.get(key) ?? null,
    updateExportContentHash: async (key, exportContentHash) => {
      const existing = store.get(key);
      if (existing) {
        store.set(key, { ...existing, exportContentHash });
      }
    },
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

  it('writes ssotLinks into configured links section', async () => {
    const repoRoot = path.join(os.tmpdir(), `urms-context-export-links-${Date.now()}`);
    const relativePath = '.cursor/context/project-status.md';
    const absolutePath = path.join(repoRoot, relativePath);
    await mkdir(path.dirname(absolutePath), { recursive: true });
    await writeFile(
      absolutePath,
      '# プロジェクト状態\n\n## サマリ\n\n| 項目 | 値 |\n| 状態 | **Old** |\n\n## リンク\n\n- [Old](old.md)\n',
      'utf8',
    );

    const repository = createRepository([
      {
        key: 'project_status',
        summary: 'New status',
        ssotLinks: [{ label: 'Roadmap', path: '../../docs/project/roadmap.md' }],
        updatedAt: new Date().toISOString(),
        updatedBy: 'developer',
      },
    ]);

    const service = createContextSsotExportService({ repoRoot, contextRepository: repository });
    await service.export('developer', 'develop');

    const content = await readFile(absolutePath, 'utf8');
    expect(content).toContain('| 状態 | **New status** |');
    expect(content).toContain('- [Roadmap](../../docs/project/roadmap.md)');
    expect(content).not.toContain('[Old](old.md)');
  });

  it('reports conflict and skips write when export baseline hash mismatches', async () => {
    const repoRoot = path.join(os.tmpdir(), `urms-context-export-conflict-${Date.now()}`);
    const relativePath = '.cursor/context/current-task.md';
    const absolutePath = path.join(repoRoot, relativePath);
    await mkdir(path.dirname(absolutePath), { recursive: true });
    const content = '# 現在タスク\n\n## Task\n\n**Local edit**\n\nBody\n';
    await writeFile(absolutePath, content, 'utf8');

    const repository = createRepository([
      {
        key: 'current_task',
        summary: 'Exported task summary',
        ssotLinks: [],
        exportContentHash: 'baseline-mismatch',
        updatedAt: new Date().toISOString(),
        updatedBy: 'developer',
      },
    ]);

    const service = createContextSsotExportService({ repoRoot, contextRepository: repository });
    const report = await service.export('developer', 'develop');

    expect(report.conflicts).toBe(1);
    expect(await readFile(absolutePath, 'utf8')).toBe(content);
  });
});
