/** 書戻し API レスポンス */
export type CursorExportReport = {
  conflicts?: number;
};

export function formatExportResultMessage(data: unknown): string {
  const conflicts = (data as CursorExportReport | null)?.conflicts ?? 0;
  if (conflicts > 0) {
    return `書戻し完了 · 食い違い ${conflicts} 件（上書きしませんでした）`;
  }
  return '書戻し完了';
}
