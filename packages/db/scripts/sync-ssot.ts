import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  LocationSyncService,
  LoopSyncService,
  LoopExportService,
  ScheduleSyncService,
  resolveLocationRepoRoot,
  resolveLoopJournalRepoRoot,
  resolveScheduleRepoRoot,
} from '@urms/domain';
import { PrismaResourceRepository, createPrismaClient } from '@urms/db';

import { loadRootEnv } from './load-root-env.js';

loadRootEnv();

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

async function main(): Promise<void> {
  const prisma = createPrismaClient();
  const resourceRepository = new PrismaResourceRepository(prisma);

  const scheduleReport = await new ScheduleSyncService({
    repoRoot: resolveScheduleRepoRoot({ URMS_REPO_ROOT: repoRoot }),
    resourceRepository,
  }).sync('ssot-sync', 'operate');

  const locationReport = await new LocationSyncService({
    repoRoot: resolveLocationRepoRoot({ URMS_REPO_ROOT: repoRoot }),
    resourceRepository,
  }).sync('ssot-sync', 'operate');

  const loopReport = await new LoopSyncService({
    repoRoot: resolveLoopJournalRepoRoot({ URMS_REPO_ROOT: repoRoot }),
    resourceRepository,
  }).sync('ssot-sync', 'operate');

  const loopExportReport = await new LoopExportService({
    repoRoot: resolveLoopJournalRepoRoot({ URMS_REPO_ROOT: repoRoot }),
    resourceRepository,
  }).export('ssot-sync', 'operate');

  console.log(
    JSON.stringify(
      {
        repoRoot,
        schedule: scheduleReport,
        location: locationReport,
        loop: loopReport,
        loopExport: loopExportReport,
      },
      null,
      2,
    ),
  );
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
