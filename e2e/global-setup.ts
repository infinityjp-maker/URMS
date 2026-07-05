import { execSync, spawn, type ChildProcess } from 'node:child_process';
import path from 'node:path';
import { writeFileSync } from 'node:fs';

const rootDir = process.cwd();
const stateFile = path.join(rootDir, 'e2e', '.e2e-state.json');

async function waitForHealth(url: string, timeoutMs = 60_000): Promise<void> {
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      // retry
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`API health check failed: ${url}`);
}

function tryMigrate(): boolean {
  process.env.DATABASE_URL ??= 'postgresql://urms:urms@localhost:5432/urms?schema=public';
  process.env.URMS_AUTH_BYPASS ??= 'true';
  process.env.URMS_FF_AI_ENABLED ??= 'false';

  try {
    execSync(process.platform === 'win32' ? 'corepack pnpm db:migrate' : 'pnpm db:migrate', {
      cwd: rootDir,
      stdio: 'pipe',
      env: process.env,
      shell: process.platform === 'win32',
    });
    return true;
  } catch {
    return false;
  }
}

export default async function globalSetup(): Promise<void> {
  if (!tryMigrate()) {
    process.env.E2E_SKIP = '1';
    writeFileSync(stateFile, JSON.stringify({ skip: true }));
    return;
  }

  const apiProcess: ChildProcess = spawn(
    process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm',
    ['--filter', '@urms/api', 'dev'],
    {
      cwd: rootDir,
      env: process.env,
      stdio: 'pipe',
      shell: process.platform === 'win32',
    },
  );

  await waitForHealth('http://localhost:3000/health');

  writeFileSync(
    stateFile,
    JSON.stringify({
      skip: false,
      apiPid: apiProcess.pid,
    }),
  );
}
