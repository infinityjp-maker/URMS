/** URMS 操作モード（ADR-003 · develop は ff.develop.enabled 時） */
export const URMS_MODES = ['plan', 'operate', 'audit', 'develop'] as const;

/** MVP コア Mode（develop 除く） */
export const URMS_CORE_MODES = ['plan', 'operate', 'audit'] as const;

export type UrmsMode = (typeof URMS_MODES)[number];

export function isUrmsMode(value: string): value is UrmsMode {
  return (URMS_MODES as readonly string[]).includes(value);
}
