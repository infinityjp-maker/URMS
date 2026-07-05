import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { PostgreSqlContainer } from '@testcontainers/postgresql';

import { createApp } from '../create-app.js';
import { createAppServices } from '../lib/wire-services.js';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const dbPackageRoot = path.resolve(packageRoot, '../../packages/db');

function isDockerAvailable(): boolean {
  try {
    execSync('docker info', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

async function startTestDatabase(): Promise<{
  container: StartedPostgreSqlContainer;
  databaseUrl: string;
}> {
  const container = await new PostgreSqlContainer('postgres:16-alpine').start();
  const databaseUrl = container.getConnectionUri();

  execSync('pnpm exec prisma migrate deploy', {
    cwd: dbPackageRoot,
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'pipe',
  });

  return { container, databaseUrl };
}

const dockerAvailable = isDockerAvailable();

describe.runIf(dockerAvailable)('Plugin API (integration)', () => {
  let container: StartedPostgreSqlContainer;
  let app: Awaited<ReturnType<typeof createApp>>;

  beforeAll(async () => {
    const testDb = await startTestDatabase();
    container = testDb.container;
    app = await createApp({
      services: createAppServices(testDb.databaseUrl),
      logger: false,
    });
  }, 120_000);

  afterAll(async () => {
    await app.close();
    await container.stop();
  }, 30_000);

  it('lists resource type plugins', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/v1/plugins/resource-types',
      headers: { 'x-urms-mode': 'operate' },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().data.length).toBeGreaterThanOrEqual(4);
  });

  it('rejects physical resource without required metadata', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/v1/resources',
      headers: { 'x-urms-mode': 'operate' },
      payload: {
        resourceType: 'physical',
        resourceId: 'missing-location',
        name: 'Missing Location',
        metadata: {},
      },
    });

    expect(response.statusCode).toBe(422);
    expect(response.json().error.code).toBe('PLUGIN_VALIDATION_FAILED');
  });
});
