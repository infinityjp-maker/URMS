import { createHmac, timingSafeEqual } from 'node:crypto';

import type { AccessTokenClaims } from '../types/auth.js';

function base64UrlEncode(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, 'base64url').toString('utf8');
}

export function signAccessToken(
  claims: Omit<AccessTokenClaims, 'iat' | 'exp'>,
  secret: string,
  expiresInSeconds: number,
): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: AccessTokenClaims = {
    ...claims,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64UrlEncode(JSON.stringify(payload));
  const signature = createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');

  return `${header}.${body}.${signature}`;
}

export function verifyAccessToken(token: string, secret: string): AccessTokenClaims {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid token format');
  }

  const [header, body, signature] = parts;
  const expected = createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
  const sigBuf = Buffer.from(signature!, 'base64url');
  const expBuf = Buffer.from(expected, 'base64url');

  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
    throw new Error('Invalid token signature');
  }

  const claims = JSON.parse(base64UrlDecode(body!)) as AccessTokenClaims;
  const now = Math.floor(Date.now() / 1000);

  if (typeof claims.exp !== 'number' || claims.exp <= now) {
    throw new Error('Token expired');
  }

  if (typeof claims.sub !== 'string' || !claims.sub) {
    throw new Error('Invalid token subject');
  }

  return claims;
}
