import type { PrismaClient } from '@prisma/client';

export type DatabaseHealthStatus = 'ok' | 'unavailable';

export async function checkDatabaseHealth(prisma: PrismaClient): Promise<DatabaseHealthStatus> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return 'ok';
  } catch {
    return 'unavailable';
  }
}
