import type { UrmsMode } from '@urms/shared';

/** Browser-safe copy — do not import value exports from @urms/shared (pulls node:crypto). */
export const DESKTOP_CORE_MODES = ['plan', 'operate', 'audit'] as const satisfies readonly UrmsMode[];
