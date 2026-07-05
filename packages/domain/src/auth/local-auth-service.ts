import { AppError, ERROR_CODES, signAccessToken, verifyPassword, type LocalLoginResult } from '@urms/shared';

import type { UserRepository } from '../repository/user-repository.js';

export interface LocalAuthServiceOptions {
  jwtSecret: string;
  tokenExpiresInSeconds?: number;
}

export class LocalAuthService {
  private readonly tokenExpiresInSeconds: number;

  constructor(
    private readonly users: UserRepository,
    private readonly options: LocalAuthServiceOptions,
  ) {
    this.tokenExpiresInSeconds = options.tokenExpiresInSeconds ?? 60 * 60 * 8;
  }

  async login(username: string, password: string): Promise<LocalLoginResult> {
    const normalized = username.trim();
    if (!normalized || !password) {
      throw new AppError(ERROR_CODES.AUTH_INVALID_CREDENTIALS, 'Invalid username or password');
    }

    const user = await this.users.findByLogin(normalized);
    if (!user?.passwordHash || !verifyPassword(password, user.passwordHash)) {
      throw new AppError(ERROR_CODES.AUTH_INVALID_CREDENTIALS, 'Invalid username or password');
    }

    const accessToken = signAccessToken(
      {
        sub: user.id,
        email: user.email,
        roles: user.roles,
      },
      this.options.jwtSecret,
      this.tokenExpiresInSeconds,
    );

    return {
      accessToken,
      expiresIn: this.tokenExpiresInSeconds,
      tokenType: 'Bearer',
      user: {
        id: user.id,
        externalId: user.externalId,
        email: user.email,
        roles: user.roles,
      },
    };
  }
}
