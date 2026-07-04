/** URMS 操作モード（ADR-003） */
export const URMS_MODES = ['plan', 'operate', 'audit'] as const;

export type UrmsMode = (typeof URMS_MODES)[number];

export function isUrmsMode(value: string): value is UrmsMode {
  return (URMS_MODES as readonly string[]).includes(value);
}
