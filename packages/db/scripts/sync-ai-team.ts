import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  AiTeamSyncService,
  InProcessEventBus,
  RelationService,
  resolveAiTeamRepoRoot,
} from '@urms/domain';
import {
  PrismaRelationRepository,
  PrismaResourceRepository,
  createPrismaClient,
} from '@urms/db';

import { loadRootEnv } from './load-root-env.js';

loadRootEnv();

const repoRoot = resolveAiTeamRepoRoot({
  URMS_REPO_ROOT: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..'),
});

async function main(): Promise<void> {
  const prisma = createPrismaClient();
  const eventBus = new InProcessEventBus();
  const resourceRepository = new PrismaResourceRepository(prisma);
  const relationRepository = new PrismaRelationRepository(prisma);
  const relationService = new RelationService(relationRepository, resourceRepository, eventBus);
  const syncService = new AiTeamSyncService({
    repoRoot,
    resourceRepository,
    relationService,
  });

  const report = await syncService.sync('ai-team-sync', 'operate');
  console.log(JSON.stringify({ repoRoot, ...report }, null, 2));
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
