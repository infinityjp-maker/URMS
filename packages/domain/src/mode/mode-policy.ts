import { AppError, ERROR_CODES, type UrmsMode } from '@urms/shared';

export interface ModePolicy {
  canReadResource(mode: UrmsMode): boolean;
  canWriteResource(mode: UrmsMode): boolean;
  canReadContext(mode: UrmsMode): boolean;
  canUpdateContext(mode: UrmsMode): boolean;
  canViewAudit(mode: UrmsMode): boolean;
  canSwitchMode(mode: UrmsMode): boolean;
  canSyncIntegrations(mode: UrmsMode): boolean;
}

export const modePolicy: ModePolicy = {
  canReadResource: () => true,
  canWriteResource: (mode) => mode === 'operate' || mode === 'develop',
  canReadContext: (mode) => mode === 'plan' || mode === 'operate' || mode === 'develop',
  canUpdateContext: (mode) => mode === 'plan' || mode === 'develop',
  canViewAudit: (mode) => mode === 'audit' || mode === 'develop',
  canSwitchMode: () => true,
  canSyncIntegrations: (mode) => mode === 'develop',
};

export function assertModeAllowed(allowed: boolean, message: string): void {
  if (!allowed) {
    throw new AppError(ERROR_CODES.MODE_NOT_ALLOWED, message);
  }
}
