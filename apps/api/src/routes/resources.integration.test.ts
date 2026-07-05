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

describe.runIf(dockerAvailable)('Resource API (integration)', () => {
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

  it('creates and retrieves a resource', async () => {
    const createResponse = await app.inject({
      method: 'POST',
      url: '/v1/resources',
      headers: { 'x-urms-mode': 'operate' },
      payload: {
        resourceType: 'physical',
        resourceId: 'api-server-01',
        name: 'API Server 01',
      },
    });

    expect(createResponse.statusCode).toBe(201);

    const getResponse = await app.inject({
      method: 'GET',
      url: '/v1/resources/physical/api-server-01',
      headers: { 'x-urms-mode': 'operate' },
    });

    expect(getResponse.statusCode).toBe(200);
    expect(getResponse.json().data.name).toBe('API Server 01');
  });

  it('writes audit log on resource create', async () => {
    await app.inject({
      method: 'POST',
      url: '/v1/resources',
      headers: { 'x-urms-mode': 'operate' },
      payload: {
        resourceType: 'digital',
        resourceId: 'audit-target',
        name: 'Audit Target',
      },
    });

    const auditResponse = await app.inject({
      method: 'GET',
      url: '/v1/audit/logs',
      headers: { 'x-urms-mode': 'audit' },
    });

    expect(auditResponse.statusCode).toBe(200);
    expect(auditResponse.json().meta.total).toBeGreaterThanOrEqual(1);
  });

  it('rejects resource create in plan mode', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/v1/resources',
      headers: { 'x-urms-mode': 'plan' },
      payload: {
        resourceType: 'physical',
        resourceId: 'denied-create',
        name: 'Denied',
      },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json().error.code).toBe('MODE_NOT_ALLOWED');
  });
});
