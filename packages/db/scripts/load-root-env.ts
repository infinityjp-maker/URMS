import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function repoRootFromModule(): string {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
}

/** Load repo root `.env` into process.env (does not overwrite existing values). */
export function loadRootEnv(repoRoot = repoRootFromModule()): void {
  const envPath = path.join(repoRoot, '.env');
  if (!existsSync(envPath)) {
    return;
  }

  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separator = trimmed.indexOf('=');
    if (separator <= 0) {
      continue;
    }

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}
