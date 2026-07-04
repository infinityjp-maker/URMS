import type { UrmsMode } from './mode.js';

/** Context スナップショット骨格（ADR-004 — S6 で拡張） */
export interface ContextSnapshot {
  phase: string;
  mode: UrmsMode;
  summary: string;
  ssotLinks: string[];
  updatedAt: string;
}
