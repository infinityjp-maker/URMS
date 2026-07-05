import { describe, expect, it, vi } from 'vitest';

import { AppError, ERROR_CODES, hashPassword } from '@urms/shared';

import { LocalAuthService } from './local-auth-service.js';
import type { UserRepository } from '../repository/user-repository.js';

describe('LocalAuthService', () => {
  const jwtSecret = 'test-secret-key-for-local-auth';

  it('returns a bearer token for valid credentials', async () => {
    const users: UserRepository = {
      findByLogin: vi.fn(async () => ({
        id: 'user-1',
        externalId: 'operator',
        email: 'operator@local',
        roles: ['operator'],
        passwordHash: hashPassword('change-me'),
      })),
    };

    const service = new LocalAuthService(users, { jwtSecret });
    const result = await service.login('operator', 'change-me');

    expect(result.tokenType).toBe('Bearer');
    expect(result.user.externalId).toBe('operator');
    expect(result.accessToken.split('.')).toHaveLength(3);
  });

  it('rejects invalid credentials', async () => {
    const users: UserRepository = {
      findByLogin: vi.fn(async () => null),
    };

    const service = new LocalAuthService(users, { jwtSecret });

    await expect(service.login('unknown', 'bad')).rejects.toMatchObject({
      code: ERROR_CODES.AUTH_INVALID_CREDENTIALS,
    } satisfies Partial<AppError>);
  });
});
