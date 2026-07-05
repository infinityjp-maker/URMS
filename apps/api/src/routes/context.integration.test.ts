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

describe.runIf(dockerAvailable)('Context API (integration)', () => {
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

  it('returns default context dashboard in plan mode', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/v1/context',
      headers: { 'x-urms-mode': 'plan' },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.data.activeMode).toBe('plan');
    expect(body.data.items.length).toBeGreaterThanOrEqual(6);
  });

  it('updates context in plan mode', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: '/v1/context',
      headers: { 'x-urms-mode': 'plan' },
      payload: {
        items: [
          {
            key: 'current_task',
            summary: 'Integration test task',
            ssotLinks: [{ label: 'VISION', path: '/docs/project/VISION.md' }],
          },
        ],
      },
    });

    expect(response.statusCode).toBe(200);
    const task = response.json().data.items.find(
      (item: { key: string }) => item.key === 'current_task',
    );
    expect(task.summary).toBe('Integration test task');
  });

  it('denies context update in operate mode', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: '/v1/context',
      headers: { 'x-urms-mode': 'operate' },
      payload: {
        items: [{ key: 'current_task', summary: 'Should fail' }],
      },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json().error.code).toBe('MODE_NOT_ALLOWED');
  });
});
