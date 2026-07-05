import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export interface TestDatabase {
  container: StartedPostgreSqlContainer;
  databaseUrl: string;
}

export function isDockerAvailable(): boolean {
  try {
    execSync('docker info', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

export async function startTestDatabase(): Promise<TestDatabase> {
  const container = await new PostgreSqlContainer('postgres:16-alpine').start();
  const databaseUrl = container.getConnectionUri();

  execSync('pnpm exec prisma migrate deploy', {
    cwd: packageRoot,
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
    },
    stdio: 'pipe',
  });

  return { container, databaseUrl };
}

export async function stopTestDatabase(container: StartedPostgreSqlContainer): Promise<void> {
  await container.stop();
}
