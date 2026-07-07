import type { UrmsMode } from '@urms/shared';
import { modePolicy } from '@urms/domain';

export function canShowIntegrationsNav(mode: UrmsMode): boolean {
  return modePolicy.canSyncIntegrations(mode);
}

export function getModeLabel(mode: UrmsMode): string {
  const labels: Record<UrmsMode, string> = {
    plan: '計画',
    operate: '運用',
    audit: '監査',
    develop: '開発',
  };
  return labels[mode];
}
