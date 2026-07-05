/** ADR-019 — Feature Flag 評価（Application 層から利用） */
export const FEATURE_FLAGS = {
  AI_ENABLED: 'ff.ai.enabled',
  AI_FALLBACK: 'ff.ai.fallback',
  DEVELOP_ENABLED: 'ff.develop.enabled',
} as const;

const DEFAULT_FLAGS: Record<string, boolean> = {
  'ff.ai.enabled': false,
  'ff.ai.fallback': true,
  'ff.develop.enabled': false,
};

function envKeyForFlag(flag: string): string {
  return `URMS_${flag.replace(/\./g, '_').toUpperCase()}`;
}

export function isFeatureEnabled(flag: string, env: NodeJS.ProcessEnv = process.env): boolean {
  const override = env[envKeyForFlag(flag)];
  if (override !== undefined) {
    return override === 'true' || override === '1';
  }

  return DEFAULT_FLAGS[flag] ?? false;
}
