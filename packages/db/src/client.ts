import { PrismaClient } from '@prisma/client';

let client: PrismaClient | undefined;

export function createPrismaClient(databaseUrl?: string): PrismaClient {
  return new PrismaClient(
    databaseUrl
      ? {
          datasources: {
            db: { url: databaseUrl },
          },
        }
      : undefined,
  );
}

export function getPrismaClient(): PrismaClient {
  if (!client) {
    client = createPrismaClient();
  }

  return client;
}

export async function disconnectPrismaClient(): Promise<void> {
  if (client) {
    await client.$disconnect();
    client = undefined;
  }
}
