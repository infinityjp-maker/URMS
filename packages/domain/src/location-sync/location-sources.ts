import { readdir } from 'node:fs/promises';
import path from 'node:path';

export const LOCATION_SOURCE_DIR = '.cursor/resources/location';

export async function resolveLocationFiles(repoRoot: string): Promise<string[]> {
  const dir = path.join(repoRoot, LOCATION_SOURCE_DIR);
  const entries = await readdir(dir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md') && entry.name.toLowerCase() !== 'readme.md')
    .map((entry) => path.join(dir, entry.name));
}

export function toRepoRelative(repoRoot: string, absolutePath: string): string {
  return path.relative(repoRoot, absolutePath).replace(/\\/g, '/');
}

export function fallbackNameFromPath(relativePath: string): string {
  return path.basename(relativePath, path.extname(relativePath));
}

export function resolveLocationRepoRoot(env: NodeJS.ProcessEnv = process.env): string {
  if (env.URMS_REPO_ROOT?.trim()) {
    return path.resolve(env.URMS_REPO_ROOT);
  }

  return path.resolve(process.cwd());
}
