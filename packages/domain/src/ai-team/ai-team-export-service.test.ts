import { mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import type { ResourceEntity } from '@urms/shared';

import type { ResourceRepository } from '../repository/resource-repository.js';
import { hashContent } from '../shared/hash-content.js';
import { createAiTeamExportService } from './ai-team-export-service.js';

function createRepository(entity: ResourceEntity): ResourceRepository {
  let saved = entity;
  return {
    findByRef: async (resourceType, resourceId) =>
      resourceType === saved.resourceType && resourceId === saved.resourceId ? saved : null,
    list: async () => ({ items: [saved], total: 1, page: 1, limit: 1 }),
    save: async (next) => {
      saved = next;
      return next;
    },
    exists: async () => true,
  };
}

async function createFixture(title: string, resourceName: string): Promise<{
  repoRoot: string;
  relativePath: string;
  repository: ResourceRepository;
}> {
  const repoRoot = path.join(os.tmpdir(), `urms-ai-export-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  const relativePath = '.cursor/context/sample.md';
  const absolutePath = path.join(repoRoot, relativePath);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  const now = new Date().toISOString();
  const entity: ResourceEntity = {
    resourceType: 'context',
    resourceId: 'sample',
    name: resourceName,
    status: 'active',
    metadata: { ssot: 'ai-team-sync', sourcePath: relativePath, urmsSummary: resourceName },
    createdAt: now,
    updatedAt: now,
  };
  await writeFile(
    absolutePath,
    `# ${title}\n\n**resource_type:** context\n**resource_id:** context:sample\n`,
    'utf8',
  );

  const repository = createRepository(entity);

  return { repoRoot, relativePath, repository };
}

describe('AiTeamExportService', () => {
  it('writes Resource.name back to markdown H1', async () => {
    const fixture = await createFixture('Old Title', 'Updated Title');
    const service = createAiTeamExportService({
      repoRoot: fixture.repoRoot,
      resourceRepository: fixture.repository,
    });

    const report = await service.export('developer', 'develop');

    expect(report.updated).toBe(1);
    const content = await readFile(path.join(fixture.repoRoot, fixture.relativePath), 'utf8');
    expect(content.startsWith('# Updated Title')).toBe(true);
  });

  it('reports unchanged when title already matches', async () => {
    const fixture = await createFixture('Same Title', 'Same Title');
    await writeFile(
      path.join(fixture.repoRoot, fixture.relativePath),
      `# Same Title\n\n**resource_type:** context\n**resource_id:** context:sample\n\n## URMS Export\n\n**Summary:** Same Title\n`,
      'utf8',
    );
    const service = createAiTeamExportService({
      repoRoot: fixture.repoRoot,
      resourceRepository: fixture.repository,
    });

    const report = await service.export('developer', 'develop');

    expect(report.updated).toBe(0);
    expect(report.unchanged).toBeGreaterThanOrEqual(1);
  });

  it('writes URMS Export block from metadata.urmsSummary', async () => {
    const fixture = await createFixture('Title', 'Title');
    const now = new Date().toISOString();
    const repository = createRepository({
      resourceType: 'context',
      resourceId: 'sample',
      name: 'Title',
      status: 'active',
      metadata: {
        ssot: 'ai-team-sync',
        sourcePath: fixture.relativePath,
        urmsSummary: 'Body summary from DB',
      },
      createdAt: now,
      updatedAt: now,
    });
    const service = createAiTeamExportService({
      repoRoot: fixture.repoRoot,
      resourceRepository: repository,
    });

    const report = await service.export('developer', 'develop');

    expect(report.updated).toBe(1);
    const content = await readFile(path.join(fixture.repoRoot, fixture.relativePath), 'utf8');
    expect(content).toContain('**Summary:** Body summary from DB');
  });

  it('reports conflict when file contentHash differs from stored metadata', async () => {
    const fixture = await createFixture('Title', 'Title');
    const absolutePath = path.join(fixture.repoRoot, fixture.relativePath);
    const fileContent = await readFile(absolutePath, 'utf8');
    const now = new Date().toISOString();
    const repository = createRepository({
      resourceType: 'context',
      resourceId: 'sample',
      name: 'Title',
      status: 'active',
      metadata: {
        ssot: 'ai-team-sync',
        sourcePath: fixture.relativePath,
        contentHash: 'stale-hash',
        urmsSummary: 'Title',
      },
      createdAt: now,
      updatedAt: now,
    });
    const service = createAiTeamExportService({
      repoRoot: fixture.repoRoot,
      resourceRepository: repository,
    });

    const report = await service.export('developer', 'develop');

    expect(report.conflicts).toBe(1);
    expect(report.items.some((item) => item.action === 'conflict')).toBe(true);
    expect(await readFile(absolutePath, 'utf8')).toBe(fileContent);
  });

  it('writes Status and Owner into URMS Export block from metadata', async () => {
    const fixture = await createFixture('Title', 'Title');
    const now = new Date().toISOString();
    const repository = createRepository({
      resourceType: 'context',
      resourceId: 'sample',
      name: 'Title',
      status: 'active',
      metadata: {
        ssot: 'ai-team-sync',
        sourcePath: fixture.relativePath,
        contentHash: hashContent(
          await readFile(path.join(fixture.repoRoot, fixture.relativePath), 'utf8'),
        ),
        urmsSummary: 'Summary line',
        urmsStatus: 'doing',
        urmsOwner: 'PM',
      },
      createdAt: now,
      updatedAt: now,
    });
    const service = createAiTeamExportService({
      repoRoot: fixture.repoRoot,
      resourceRepository: repository,
    });

    await service.export('developer', 'develop');

    const content = await readFile(path.join(fixture.repoRoot, fixture.relativePath), 'utf8');
    expect(content).toContain('**Summary:** Summary line');
    expect(content).toContain('**Status:** doing');
    expect(content).toContain('**Owner:** PM');
  });
});
