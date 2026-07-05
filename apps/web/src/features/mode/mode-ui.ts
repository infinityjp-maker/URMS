import type { UrmsMode } from '@urms/shared';
import { modePolicy } from '@urms/domain';

export function canShowResourceWrite(mode: UrmsMode): boolean {
  return modePolicy.canWriteResource(mode);
}

export function canShowAuditNav(mode: UrmsMode): boolean {
  return modePolicy.canViewAudit(mode);
}

export function getModeLabel(mode: UrmsMode): string {
  const labels: Record<UrmsMode, string> = {
    plan: '計画',
    operate: '運用',
    audit: '監査',
  };
  return labels[mode];
}
