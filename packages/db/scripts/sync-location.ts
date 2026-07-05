import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { LocationSyncService, resolveLocationRepoRoot } from '@urms/domain';
import { PrismaResourceRepository, createPrismaClient } from '@urms/db';

const repoRoot = resolveLocationRepoRoot({
  URMS_REPO_ROOT: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..'),
});

async function main(): Promise<void> {
  const prisma = createPrismaClient();
  const resourceRepository = new PrismaResourceRepository(prisma);
  const syncService = new LocationSyncService({
    repoRoot,
    resourceRepository,
  });

  const report = await syncService.sync('location-sync', 'operate');
  console.log(JSON.stringify({ repoRoot, ...report }, null, 2));
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
