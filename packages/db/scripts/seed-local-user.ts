import { createPrismaClient } from '../client.js';
import { hashPassword } from '@urms/shared';

import { loadRootEnv } from './load-root-env.js';

loadRootEnv();

const DEFAULT_LOGIN = 'operator';
const DEFAULT_EMAIL = 'operator@local';
const DEFAULT_PASSWORD = process.env.URMS_LOCAL_DEFAULT_PASSWORD ?? 'change-me';

async function main(): Promise<void> {
  const prisma = createPrismaClient();
  const passwordHash = hashPassword(DEFAULT_PASSWORD);

  await prisma.user.upsert({
    where: { externalId: DEFAULT_LOGIN },
    create: {
      externalId: DEFAULT_LOGIN,
      email: DEFAULT_EMAIL,
      displayName: 'Local Operator',
      passwordHash,
      roles: ['operator', 'planner'],
    },
    update: {
      passwordHash,
      roles: ['operator', 'planner'],
    },
  });

  console.log(`Local user seeded: ${DEFAULT_LOGIN} (${DEFAULT_EMAIL})`);
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
