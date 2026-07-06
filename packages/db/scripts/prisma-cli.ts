import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadRootEnv } from './load-root-env.js';

loadRootEnv();

const dbRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const prismaArgs = process.argv.slice(2);

if (prismaArgs.length === 0) {
  console.error('Usage: tsx scripts/prisma-cli.ts <prisma-subcommand> [...args]');
  process.exit(1);
}

const result = spawnSync('npx', ['prisma', ...prismaArgs], {
  stdio: 'inherit',
  cwd: dbRoot,
  env: process.env,
  shell: process.platform === 'win32',
});

process.exit(result.status ?? 1);
