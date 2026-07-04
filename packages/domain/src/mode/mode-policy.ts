import { AppError, ERROR_CODES, type UrmsMode } from '@urms/shared';

export interface ModePolicy {
  canReadResource(mode: UrmsMode): boolean;
  canWriteResource(mode: UrmsMode): boolean;
  canUpdateContext(mode: UrmsMode): boolean;
  canViewAudit(mode: UrmsMode): boolean;
  canSwitchMode(mode: UrmsMode): boolean;
}

export const modePolicy: ModePolicy = {
  canReadResource: () => true,
  canWriteResource: (mode) => mode === 'operate',
  canUpdateContext: (mode) => mode === 'plan',
  canViewAudit: (mode) => mode === 'audit',
  canSwitchMode: () => true,
};

export function assertModeAllowed(allowed: boolean, message: string): void {
  if (!allowed) {
    throw new AppError(ERROR_CODES.MODE_NOT_ALLOWED, message);
  }
}
