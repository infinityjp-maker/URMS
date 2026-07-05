import type { PrismaClient } from '@prisma/client';

import type { StoredUser, UserRepository } from '@urms/domain';

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByLogin(login: string): Promise<StoredUser | null> {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ externalId: login }, { email: login }],
      },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      externalId: user.externalId,
      email: user.email,
      roles: user.roles,
      passwordHash: user.passwordHash,
    };
  }
}
