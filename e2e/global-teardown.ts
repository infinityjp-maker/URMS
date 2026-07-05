import { execSync, readFileSync, unlinkSync } from 'node:fs';
import path from 'node:path';

const stateFile = path.join(process.cwd(), 'e2e', '.e2e-state.json');
function stopProcess(pid: number): void {
  if (process.platform === 'win32') {
    execSync(`taskkill /PID ${pid} /T /F`, { stdio: 'ignore' });
    return;
  }

  process.kill(pid, 'SIGTERM');
}

export default async function globalTeardown(): Promise<void> {
  try {
    const state = JSON.parse(readFileSync(stateFile, 'utf8')) as { apiPid?: number };
    if (state.apiPid) {
      stopProcess(state.apiPid);
    }
    unlinkSync(stateFile);
  } catch {
    // no-op
  }
}
