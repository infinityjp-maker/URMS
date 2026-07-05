export type UrmsAuthMode = 'bypass' | 'local';

export interface AuthRuntimeConfig {
  mode: UrmsAuthMode;
  jwtSecret: string | null;
}

export function resolveAuthConfig(env: NodeJS.ProcessEnv = process.env): AuthRuntimeConfig {
  const explicitMode = env.URMS_AUTH_MODE?.trim().toLowerCase();

  if (explicitMode === 'bypass' || explicitMode === 'local') {
    return {
      mode: explicitMode,
      jwtSecret: env.JWT_SECRET?.trim() || null,
    };
  }

  const bypass = env.URMS_AUTH_BYPASS !== 'false';
  return {
    mode: bypass ? 'bypass' : 'local',
    jwtSecret: env.JWT_SECRET?.trim() || null,
  };
}
