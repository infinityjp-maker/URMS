import type { UrmsMode } from './mode.js';

export const CONTEXT_SUMMARY_MAX_LENGTH = 500;

export const CONTEXT_KEYS = [
  'current_phase',
  'current_task',
  'next_task',
  'project_status',
  'active_mode',
  'ssot_links',
] as const;

export type ContextKey = (typeof CONTEXT_KEYS)[number];

/** PM が plan Mode で更新可能な key（active_mode はシステム管理） */
export const EDITABLE_CONTEXT_KEYS = [
  'current_phase',
  'current_task',
  'next_task',
  'project_status',
  'ssot_links',
] as const satisfies readonly ContextKey[];

export type EditableContextKey = (typeof EDITABLE_CONTEXT_KEYS)[number];

export interface SsotLink {
  label: string;
  path: string;
  resourceType?: string;
  resourceId?: string;
}

export interface ContextSnapshotItem {
  key: ContextKey;
  summary: string;
  ssotLinks: SsotLink[];
  updatedAt: string;
  updatedBy: string;
}

export interface ContextDashboard {
  items: ContextSnapshotItem[];
  activeMode: UrmsMode;
}

export interface ContextUpdateItem {
  key: EditableContextKey;
  summary: string;
  ssotLinks?: SsotLink[];
}

/** VT-4 — advance-task で journal.md に追記した 1 行の要約 */
export type LoopJournalRecordedEntry = {
  completed: string;
  next?: string;
  at: string;
};

export type AdvanceTaskResponse = {
  data: ContextDashboard;
  meta: {
    journalEntry: LoopJournalRecordedEntry | null;
  };
};
