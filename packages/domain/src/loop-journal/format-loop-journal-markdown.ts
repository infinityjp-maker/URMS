import type { LoopJournalEntry } from './loop-journal-service.js';

/** ADR-024 M4 — export 先 journal.md の固定ヘッダ（Git 可視性用 · 正本は DB） */
export const LOOP_JOURNAL_EXPORT_HEADER = `# 日次ループジャーナル

> **resource_type:** knowledge  
> **resource_id:** knowledge:loop-journal  
> **owner:** URMS 窓 · advance-task

窓の「完了 → 次へ」操作の記録。**正本は loop-entry Resource（DB）** · 本ファイルは \`pnpm loop:export\` による export です。

`;

export function formatLoopJournalLine(entry: LoopJournalEntry): string {
  const stamp = entry.at.toLocaleString('ja-JP', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const nextPart = entry.next ? ` → 次: ${entry.next}` : '';
  return `- ${stamp} · 完了: ${entry.completed}${nextPart} (${entry.actorId})`;
}

/** loop-entry Resource 一覧から journal.md 全文を生成 */
export function formatLoopJournalMarkdown(entries: LoopJournalEntry[]): string {
  const lines = entries.map((entry) => formatLoopJournalLine(entry));

  if (lines.length === 0) {
    return LOOP_JOURNAL_EXPORT_HEADER.trimEnd() + '\n';
  }

  return `${LOOP_JOURNAL_EXPORT_HEADER}${lines.join('\n')}\n`;
}
