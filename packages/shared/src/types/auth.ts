export interface LocalAuthUser {
  id: string;
  externalId: string;
  email: string;
  roles: string[];
}

export interface LocalLoginResult {
  accessToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
  user: LocalAuthUser;
}

export interface AccessTokenClaims {
  sub: string;
  email: string;
  roles: string[];
  iat: number;
  exp: number;
}
