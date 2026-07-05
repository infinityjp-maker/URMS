/** SemVer 互換チェック（Contract §8.5 — major 不一致で拒否） */
export function parseSemVer(value: string): { major: number; minor: number; patch: number } {
  const match = /^(\d+)\.(\d+)\.(\d+)/.exec(value.trim());
  if (!match) {
    throw new Error(`Invalid semver: ${value}`);
  }

  return {
    major: Number.parseInt(match[1]!, 10),
    minor: Number.parseInt(match[2]!, 10),
    patch: Number.parseInt(match[3]!, 10),
  };
}

export function isCoreVersionCompatible(pluginCoreVersion: string, appCoreVersion: string): boolean {
  const plugin = parseSemVer(pluginCoreVersion);
  const app = parseSemVer(appCoreVersion);
  return plugin.major === app.major;
}
