import type { ContextKey } from '@urms/shared';

export type ContextSsotTarget = {
  key: ContextKey;
  relativePath: string;
  sectionHeading: string;
  style: 'bold-line' | 'table-row';
  rowLabel?: string;
  linksSectionHeading?: string;
};

/** Context Engine → `.cursor/context/*.md` 書戻し対象 */
export const CONTEXT_SSOT_TARGETS: readonly ContextSsotTarget[] = [
  {
    key: 'current_task',
    relativePath: '.cursor/context/current-task.md',
    sectionHeading: 'Task',
    style: 'bold-line',
    linksSectionHeading: '運用',
  },
  {
    key: 'current_phase',
    relativePath: '.cursor/context/current-phase.md',
    sectionHeading: 'Phase',
    style: 'bold-line',
  },
  {
    key: 'project_status',
    relativePath: '.cursor/context/project-status.md',
    sectionHeading: 'サマリ',
    style: 'table-row',
    rowLabel: '状態',
    linksSectionHeading: 'リンク',
  },
];
