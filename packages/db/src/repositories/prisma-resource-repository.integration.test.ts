import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { StartedPostgreSqlContainer } from '@testcontainers/postgresql';

import { createPrismaClient } from '../client.js';
import { PrismaResourceRepository } from '../repositories/prisma-resource-repository.js';
import { isDockerAvailable, startTestDatabase, stopTestDatabase } from '../test/test-database.js';

const dockerAvailable = isDockerAvailable();

describe.runIf(dockerAvailable)('PrismaResourceRepository (integration)', () => {
  let container: StartedPostgreSqlContainer;
  let repository: PrismaResourceRepository;

  beforeAll(async () => {
    const testDb = await startTestDatabase();
    container = testDb.container;
    const prisma = createPrismaClient(testDb.databaseUrl);
    repository = new PrismaResourceRepository(prisma);
  }, 120_000);

  afterAll(async () => {
    await stopTestDatabase(container);
  }, 30_000);

  it('saves and finds a resource by ref', async () => {
    const now = new Date().toISOString();
    const saved = await repository.save({
      resourceType: 'physical',
      resourceId: 'server-01',
      name: 'Server 01',
      status: 'draft',
      metadata: { rack: 'A1' },
      createdAt: now,
      updatedAt: now,
    });

    const found = await repository.findByRef('physical', 'server-01');

    expect(found).toMatchObject({
      resourceType: 'physical',
      resourceId: 'server-01',
      name: 'Server 01',
      status: 'draft',
      metadata: { rack: 'A1' },
    });
    expect(found?.createdAt).toBe(saved.createdAt);
  });

  it('lists resources with filters and pagination', async () => {
    const now = new Date().toISOString();

    await repository.save({
      resourceType: 'digital',
      resourceId: 'lic-01',
      name: 'License Alpha',
      status: 'active',
      metadata: {},
      createdAt: now,
      updatedAt: now,
    });

    const result = await repository.list({
      resourceType: 'digital',
      status: 'active',
      q: 'Alpha',
      page: 1,
      limit: 10,
    });

    expect(result.total).toBeGreaterThanOrEqual(1);
    expect(result.items.some((item) => item.resourceId === 'lic-01')).toBe(true);
  });

  it('updates existing resource on save (upsert)', async () => {
    const now = new Date().toISOString();

    await repository.save({
      resourceType: 'physical',
      resourceId: 'upsert-01',
      name: 'Before',
      status: 'draft',
      metadata: {},
      createdAt: now,
      updatedAt: now,
    });

    const updated = await repository.save({
      resourceType: 'physical',
      resourceId: 'upsert-01',
      name: 'After',
      status: 'archived',
      metadata: { reason: 'logical delete' },
      createdAt: now,
      updatedAt: new Date().toISOString(),
    });

    expect(updated.name).toBe('After');
    expect(updated.status).toBe('archived');
  });

  it('reports existence by resource ref', async () => {
    expect(await repository.exists('physical', 'missing-ref')).toBe(false);

    const now = new Date().toISOString();
    await repository.save({
      resourceType: 'physical',
      resourceId: 'exists-01',
      name: 'Exists',
      status: 'draft',
      metadata: {},
      createdAt: now,
      updatedAt: now,
    });

    expect(await repository.exists('physical', 'exists-01')).toBe(true);
  });
});
