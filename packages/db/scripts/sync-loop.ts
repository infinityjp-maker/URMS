import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { LoopSyncService, resolveLoopJournalRepoRoot } from '@urms/domain';
import { PrismaResourceRepository, createPrismaClient } from '@urms/db';

import { loadRootEnv } from './load-root-env.js';

loadRootEnv();

const repoRoot = resolveLoopJournalRepoRoot({
  URMS_REPO_ROOT: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..'),
});

async function main(): Promise<void> {
  const prisma = createPrismaClient();
  const resourceRepository = new PrismaResourceRepository(prisma);
  const syncService = new LoopSyncService({
    repoRoot,
    resourceRepository,
  });

  const report = await syncService.sync('loop-sync', 'operate');
  console.log(JSON.stringify({ repoRoot, ...report }, null, 2));
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
