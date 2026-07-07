import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadLocalEnv } from './load-env.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

if (!process.env.URMS_REPO_ROOT?.trim()) {
  process.env.URMS_REPO_ROOT = repoRoot;
}

loadLocalEnv(repoRoot);
