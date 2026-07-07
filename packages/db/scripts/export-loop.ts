import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { LoopExportService, resolveLoopJournalRepoRoot } from '@urms/domain';
import { PrismaResourceRepository, createPrismaClient } from '@urms/db';

import { loadRootEnv } from './load-root-env.js';

loadRootEnv();

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

async function main(): Promise<void> {
  const prisma = createPrismaClient();
  const resourceRepository = new PrismaResourceRepository(prisma);

  const report = await new LoopExportService({
    repoRoot: resolveLoopJournalRepoRoot({ URMS_REPO_ROOT: repoRoot }),
    resourceRepository,
  }).export('loop-export', 'operate');

  console.log(JSON.stringify({ repoRoot, ...report }, null, 2));
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
