import { mkdtemp, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { loadLocalEnv } from './load-env.js';

describe('loadLocalEnv', () => {
  it('loads key-value pairs without overriding existing env', async () => {
    const repoRoot = await mkdtemp(path.join(os.tmpdir(), 'urms-env-'));
    const key = 'URMS_TEST_ENV_LOAD';
    process.env[key] = 'existing';

    await writeFile(path.join(repoRoot, '.env'), `${key}=from-file\n`, 'utf8');

    loadLocalEnv(repoRoot);

    expect(process.env[key]).toBe('existing');

    delete process.env[key];
  });
});
